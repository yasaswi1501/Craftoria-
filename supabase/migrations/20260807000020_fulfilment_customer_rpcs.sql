-- "Customer may cancel before shipment; cancellation after shipment
-- requires support/return process" -- enforced here, not left to the
-- frontend to remember to check.
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_payment_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id and user_id = auth.uid();
  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status not in ('pending_payment', 'confirmed', 'processing') then
    raise exception 'This order can no longer be cancelled online -- it has already shipped. Please contact support.';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;

  for v_item in select variant_id, quantity from public.order_items where order_id = p_order_id
  loop
    if v_order.status = 'pending_payment' then
      -- Never made it past a reservation -- release, nothing to restock.
      perform public.release_stock(v_item.variant_id, v_item.quantity);
    else
      -- Was already committed (paid or COD-confirmed) -- put it back on sale.
      perform public.restock(v_item.variant_id, v_item.quantity);
    end if;
  end loop;

  -- Money already changed hands: record a refund for staff to process
  -- (see admin_initiate_refund / the process-razorpay-refund Edge Function)
  -- rather than silently forgetting that a paid order was cancelled.
  if v_order.payment_status = 'paid' then
    select id into v_payment_id
    from public.payments
    where order_id = p_order_id and status = 'paid'
    order by created_at desc limit 1;

    insert into public.refunds (order_id, payment_id, amount, reason, status)
    values (p_order_id, v_payment_id, v_order.total_amount, coalesce(p_reason, 'Order cancelled by customer'), 'requires_review');
  end if;

  return jsonb_build_object('order_id', p_order_id, 'status', 'cancelled');
end;
$$;

create or replace function public.request_return(p_order_id uuid, p_reason text, p_images text[] default '{}')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_return_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id and user_id = auth.uid();
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'Only delivered orders can be returned';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required';
  end if;
  if exists (select 1 from public.returns where order_id = p_order_id and status <> 'rejected') then
    raise exception 'A return request already exists for this order';
  end if;

  insert into public.returns (order_id, user_id, reason, images)
  values (p_order_id, auth.uid(), p_reason, coalesce(p_images, '{}'))
  returning id into v_return_id;

  update public.orders set status = 'return_requested' where id = p_order_id;

  return jsonb_build_object('return_id', v_return_id, 'status', 'requested');
end;
$$;
