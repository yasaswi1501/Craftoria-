-- These stay grantable to `authenticated` (the default) -- staff call them
-- through their own normal login session, not a service-role backend. The
-- is_staff() check inside is the actual authorization boundary, same
-- pattern as the *_admin_write RLS policies from Phase 2. This is a
-- different situation from reserve_stock/confirm_payment_success, which
-- really do need to be unreachable from any authenticated client session.
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_new_status public.order_status,
  p_tracking_number text default null,
  p_courier text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status public.order_status;
  v_history_id uuid;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  select status into v_old_status from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  if p_note is not null then
    select id into v_history_id
    from public.order_status_history
    where order_id = p_order_id
    order by created_at desc
    limit 1;
    update public.order_status_history set note = p_note where id = v_history_id;
  end if;

  if p_tracking_number is not null or p_courier is not null then
    insert into public.shipments (order_id, courier, tracking_number, shipped_at)
    values (p_order_id, p_courier, p_tracking_number, case when p_new_status = 'shipped' then now() else null end)
    on conflict (order_id) do update set
      courier = coalesce(excluded.courier, public.shipments.courier),
      tracking_number = coalesce(excluded.tracking_number, public.shipments.tracking_number),
      shipped_at = coalesce(public.shipments.shipped_at, excluded.shipped_at);
  end if;

  if p_new_status = 'delivered' then
    update public.shipments set delivered_at = now() where order_id = p_order_id;
  end if;

  perform public.write_audit_log(
    'order_status_change', 'order', p_order_id::text,
    jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_new_status), null
  );

  return jsonb_build_object('order_id', p_order_id, 'status', p_new_status);
end;
$$;

create or replace function public.admin_review_return(
  p_return_id uuid,
  p_decision public.return_status,
  p_admin_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return record;
  v_order record;
  v_item record;
  v_payment_id uuid;
  v_old_status public.return_status;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  select * into v_return from public.returns where id = p_return_id;
  if not found then
    raise exception 'Return not found';
  end if;
  v_old_status := v_return.status;

  update public.returns set status = p_decision, admin_notes = p_admin_notes where id = p_return_id;
  select * into v_order from public.orders where id = v_return.order_id;

  if p_decision = 'rejected' then
    update public.orders set status = 'delivered' where id = v_return.order_id;
  else
    for v_item in select variant_id, quantity from public.order_items where order_id = v_return.order_id
    loop
      perform public.restock(v_item.variant_id, v_item.quantity);
    end loop;

    select id into v_payment_id
    from public.payments
    where order_id = v_return.order_id and status = 'paid'
    order by created_at desc limit 1;

    insert into public.refunds (order_id, payment_id, return_id, amount, reason, status)
    values (v_return.order_id, v_payment_id, p_return_id, v_order.total_amount, 'Approved return', 'requires_review');

    update public.orders set status = 'returned' where id = v_return.order_id;
  end if;

  perform public.write_audit_log(
    'return_review', 'return', p_return_id::text,
    jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_decision),
    jsonb_build_object('admin_notes', p_admin_notes)
  );

  return jsonb_build_object('return_id', p_return_id, 'status', p_decision);
end;
$$;

-- Moves a refund from "requires_review" into the processing queue. The
-- actual money movement (calling Razorpay's refund API) happens in the
-- process-razorpay-refund Edge Function, deliberately kept separate --
-- "never directly issue refunds from unrestricted frontend operations"
-- means a human staff action approves it here, then a second, narrowly-
-- scoped server call is what actually touches the payment provider.
create or replace function public.admin_approve_refund(p_refund_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund record;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  select * into v_refund from public.refunds where id = p_refund_id;
  if not found then
    raise exception 'Refund not found';
  end if;
  if v_refund.status <> 'requires_review' then
    raise exception 'Refund is not awaiting review (current status: %)', v_refund.status;
  end if;

  update public.refunds set status = 'initiated' where id = p_refund_id;

  perform public.write_audit_log(
    'refund_approved', 'refund', p_refund_id::text,
    jsonb_build_object('status', 'requires_review'), jsonb_build_object('status', 'initiated'), null
  );

  return jsonb_build_object('refund_id', p_refund_id, 'status', 'initiated');
end;
$$;
