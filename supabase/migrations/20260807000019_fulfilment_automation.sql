-- Invoice generation fires the moment an order is actually confirmed --
-- true for COD immediately at checkout (an INSERT straight into status
-- 'confirmed', not a later transition), and for online payment once
-- confirm_payment_success (Phase 6) flips status to 'confirmed' via UPDATE
-- -- so this needs to handle both trigger operations, not just UPDATE.
create or replace function public.generate_invoice_on_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status is distinct from 'confirmed') then
    insert into public.invoices (order_id)
    values (new.id)
    on conflict (order_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger orders_generate_invoice
  after insert or update on public.orders
  for each row execute function public.generate_invoice_on_confirm();

-- In-app notifications for customer-meaningful order events. DB-trigger
-- based rather than scattered across every RPC/Edge Function that can
-- change an order, so a notification can't be silently forgotten by a
-- future code path -- and it runs in the same transaction as the status
-- change itself, so it either both happen or neither does.
create or replace function public.notify_on_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_message text;
begin
  -- COD orders are INSERTed straight into status 'confirmed' (no prior row
  -- to diff against, `old` doesn't exist for INSERT triggers at all) --
  -- treat that as a change from "nothing" so the notification still fires.
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    v_title := case new.status
      when 'confirmed' then 'Order Confirmed'
      when 'shipped' then 'Order Shipped'
      when 'out_for_delivery' then 'Out for Delivery'
      when 'delivered' then 'Order Delivered'
      when 'cancelled' then 'Order Cancelled'
      when 'returned' then 'Return Received'
      when 'refunded' then 'Order Refunded'
      else null
    end;
    if v_title is not null then
      v_message := format('Your order %s is now %s.', new.order_number, replace(new.status::text, '_', ' '));
      insert into public.notifications (user_id, type, title, message, data)
      values (new.user_id, 'order_status', v_title, v_message, jsonb_build_object('order_id', new.id, 'status', new.status));
    end if;
  end if;

  if tg_op = 'UPDATE' and new.payment_status is distinct from old.payment_status then
    v_title := case new.payment_status
      when 'paid' then 'Payment Received'
      when 'failed' then 'Payment Failed'
      else null
    end;
    if v_title is not null then
      v_message := format('Payment for order %s: %s.', new.order_number, new.payment_status);
      insert into public.notifications (user_id, type, title, message, data)
      values (new.user_id, 'payment_status', v_title, v_message, jsonb_build_object('order_id', new.id, 'payment_status', new.payment_status));
    end if;
  end if;

  return new;
end;
$$;

create trigger orders_notify_on_change
  after insert or update on public.orders
  for each row execute function public.notify_on_order_change();

create or replace function public.notify_on_return_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.status is distinct from old.status then
    v_title := case new.status
      when 'approved' then 'Return Approved'
      when 'rejected' then 'Return Rejected'
      when 'picked_up' then 'Return Picked Up'
      else null
    end;
    if v_title is not null then
      insert into public.notifications (user_id, type, title, message, data)
      values (
        new.user_id, 'return_status', v_title,
        format('Your return request has been %s.', new.status),
        jsonb_build_object('return_id', new.id, 'order_id', new.order_id, 'status', new.status)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger returns_notify_on_change
  after update on public.returns
  for each row execute function public.notify_on_return_change();

create or replace function public.notify_on_refund_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    select user_id into v_user_id from public.orders where id = new.order_id;
    insert into public.notifications (user_id, type, title, message, data)
    values (
      v_user_id, 'refund_status', 'Refund Completed',
      format('₹%s has been refunded to your original payment method.', new.amount),
      jsonb_build_object('refund_id', new.id, 'order_id', new.order_id, 'amount', new.amount)
    );
  end if;
  return new;
end;
$$;

create trigger refunds_notify_on_change
  after update on public.refunds
  for each row execute function public.notify_on_refund_change();
