-- Called only from server-side Edge Functions (service-role key), never
-- directly by a client -- this is the one place an order actually becomes
-- "paid". Both the post-checkout signature-verified client callback and the
-- authoritative webhook converge on this same function, so there is exactly
-- one code path that can mark a payment successful.
create or replace function public.confirm_payment_success(
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_paid numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_order record;
  v_item record;
begin
  select * into v_payment
  from public.payments
  where provider = p_provider and provider_order_id = p_provider_order_id;

  if not found then
    raise exception 'No payment record found for provider_order_id %', p_provider_order_id;
  end if;

  select * into v_order from public.orders where id = v_payment.order_id;
  if not found then
    raise exception 'Order % not found for payment %', v_payment.order_id, v_payment.id;
  end if;

  -- Idempotent: the client-verified callback and the webhook can both
  -- arrive for the same payment. Second call is a safe no-op, not an error.
  if v_order.payment_status = 'paid' then
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'payment_status', v_order.payment_status, 'already_confirmed', true);
  end if;

  -- Amount must match what the order actually costs -- never trust the
  -- caller, verify against our own record even though it originated from
  -- Razorpay (defends against a compromised/misconfigured webhook sender
  -- as well as a mismatched partial-capture scenario).
  if abs(p_amount_paid - v_order.total_amount) > 0.01 then
    raise exception 'Amount mismatch for order %: expected %, got %', v_order.id, v_order.total_amount, p_amount_paid;
  end if;

  update public.payments
  set provider_payment_id = p_provider_payment_id,
      status = 'paid',
      updated_at = now()
  where id = v_payment.id;

  update public.orders
  set payment_status = 'paid',
      status = 'confirmed'
  where id = v_order.id;

  for v_item in select variant_id, quantity from public.order_items where order_id = v_order.id
  loop
    perform public.commit_stock(v_item.variant_id, v_item.quantity);
  end loop;

  return jsonb_build_object('order_id', v_order.id, 'status', 'confirmed', 'payment_status', 'paid', 'already_confirmed', false);
end;
$$;

-- Payment declined/expired/cancelled at the gateway: release the stock this
-- order had reserved at checkout time so it goes back on sale, and mark the
-- attempt failed. The order itself is left in place (not deleted) so the
-- customer's history/support can see the failed attempt.
create or replace function public.confirm_payment_failure(
  p_provider text,
  p_provider_order_id text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_order record;
  v_item record;
begin
  select * into v_payment
  from public.payments
  where provider = p_provider and provider_order_id = p_provider_order_id;

  if not found then
    raise exception 'No payment record found for provider_order_id %', p_provider_order_id;
  end if;

  select * into v_order from public.orders where id = v_payment.order_id;

  -- A late/out-of-order failure webhook must never downgrade an order that
  -- a successful confirmation already settled.
  if v_order.payment_status = 'paid' then
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'payment_status', v_order.payment_status, 'ignored', true);
  end if;

  if v_payment.status = 'failed' then
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'payment_status', v_order.payment_status, 'ignored', true);
  end if;

  update public.payments set status = 'failed', updated_at = now() where id = v_payment.id;
  update public.orders set payment_status = 'failed' where id = v_order.id;

  for v_item in select variant_id, quantity from public.order_items where order_id = v_order.id
  loop
    perform public.release_stock(v_item.variant_id, v_item.quantity);
  end loop;

  return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'payment_status', 'failed', 'reason', p_reason);
end;
$$;

-- Service-role only (Edge Functions) -- a client marking its own payment
-- paid/failed is exactly the attack this whole system exists to prevent.
revoke execute on function public.confirm_payment_success(text, text, text, numeric) from public, anon, authenticated;
revoke execute on function public.confirm_payment_failure(text, text, text) from public, anon, authenticated;
