-- Mirrors confirm_payment_success/failure from Phase 6: service-role only,
-- called from the process-razorpay-refund Edge Function's synchronous
-- response handling and from the webhook's refund.processed/refund.failed
-- events. Both converge here so there's one place a refund actually
-- becomes "completed", not two.
create or replace function public.confirm_refund_processed(
  p_provider text,
  p_provider_refund_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund record;
  v_order record;
begin
  select * into v_refund from public.refunds where provider = p_provider and provider_refund_id = p_provider_refund_id;
  if not found then
    raise exception 'No refund record found for provider_refund_id %', p_provider_refund_id;
  end if;

  if v_refund.status = 'completed' then
    return jsonb_build_object('refund_id', v_refund.id, 'status', 'completed', 'already_confirmed', true);
  end if;

  update public.refunds set status = 'completed' where id = v_refund.id;

  select * into v_order from public.orders where id = v_refund.order_id;
  -- Full refund (amount matches the order total) closes out the order;
  -- a partial refund leaves status alone -- there's still a live order.
  if abs(v_refund.amount - v_order.total_amount) <= 0.01 then
    update public.orders set payment_status = 'refunded', status = 'refunded' where id = v_order.id;
  else
    update public.orders set payment_status = 'partially_refunded' where id = v_order.id;
  end if;

  return jsonb_build_object('refund_id', v_refund.id, 'status', 'completed', 'already_confirmed', false);
end;
$$;

create or replace function public.confirm_refund_failed(
  p_provider text,
  p_provider_refund_id text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund record;
begin
  select * into v_refund from public.refunds where provider = p_provider and provider_refund_id = p_provider_refund_id;
  if not found then
    raise exception 'No refund record found for provider_refund_id %', p_provider_refund_id;
  end if;

  if v_refund.status = 'completed' then
    return jsonb_build_object('refund_id', v_refund.id, 'status', 'completed', 'ignored', true);
  end if;

  update public.refunds set status = 'failed' where id = v_refund.id;

  return jsonb_build_object('refund_id', v_refund.id, 'status', 'failed', 'reason', p_reason);
end;
$$;

revoke execute on function public.confirm_refund_processed(text, text) from public, anon, authenticated;
revoke execute on function public.confirm_refund_failed(text, text, text) from public, anon, authenticated;
