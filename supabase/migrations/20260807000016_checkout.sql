-- The one place order creation happens. Everything the client sends is
-- either an opaque snapshot (addresses) or gets ignored in favor of
-- server-computed truth (prices, stock, totals). One function = one
-- transaction: any failure partway through (bad coupon, insufficient
-- stock) rolls back everything reserved so far automatically.
create or replace function public.checkout(
  p_idempotency_key text,
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_payment_method text,
  p_delivery_option text default 'standard',
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing record;
  v_cart_id uuid;
  v_line record;
  v_subtotal numeric := 0;
  v_coupon jsonb;
  v_coupon_discount numeric := 0;
  v_member_discount numeric := 150; -- flat logged-in-member perk, matches existing frontend rule
  v_shipping_charge numeric;
  v_tax numeric;
  v_total numeric;
  v_order_status public.order_status;
  v_payment_status public.payment_status;
  v_order_id uuid;
  v_order_number text;
  v_reserved boolean;
  v_lines jsonb[] := '{}';
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;
  if p_payment_method is null or length(trim(p_payment_method)) = 0 then
    raise exception 'payment method is required';
  end if;

  -- Idempotency: a retried "Place Order" (double click, slow network retry)
  -- with the same key returns the order already created instead of making
  -- a second one.
  select id, order_number, status, payment_status, total_amount
  into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key and user_id = v_user_id;

  if found then
    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'status', v_existing.status,
      'payment_status', v_existing.payment_status,
      'total_amount', v_existing.total_amount,
      'already_existed', true
    );
  end if;

  select id into v_cart_id from public.carts where user_id = v_user_id;
  if v_cart_id is null then
    raise exception 'cart is empty';
  end if;

  -- Pass 1: validate + compute authoritative subtotal. No mutation yet --
  -- nothing is reserved until every line is confirmed purchasable.
  for v_line in
    select
      ci.variant_id,
      pv.sku,
      p.id as product_id,
      p.name as product_name,
      p.active and pv.active as is_available,
      ci.quantity,
      public.get_variant_price(ci.variant_id) as unit_price,
      coalesce(inv.available_quantity, 0) as available_quantity
    from public.cart_items ci
    join public.product_variants pv on pv.id = ci.variant_id
    join public.products p on p.id = pv.product_id
    left join public.inventory inv on inv.product_variant_id = ci.variant_id
    where ci.cart_id = v_cart_id
  loop
    if not v_line.is_available then
      raise exception 'Item no longer available: %', v_line.product_name;
    end if;
    if v_line.available_quantity < v_line.quantity then
      raise exception 'Insufficient stock for %: only % left', v_line.product_name, v_line.available_quantity;
    end if;

    v_subtotal := v_subtotal + (v_line.unit_price * v_line.quantity);
    v_lines := v_lines || jsonb_build_object(
      'variant_id', v_line.variant_id,
      'product_id', v_line.product_id,
      'sku', v_line.sku,
      'product_name', v_line.product_name,
      'quantity', v_line.quantity,
      'unit_price', v_line.unit_price
    );
  end loop;

  if array_length(v_lines, 1) is null then
    raise exception 'cart is empty';
  end if;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    v_coupon := public.validate_coupon(p_coupon_code, v_subtotal);
    if not (v_coupon->>'valid')::boolean then
      raise exception '%', v_coupon->>'message';
    end if;
    v_coupon_discount := (v_coupon->>'discount_amount')::numeric;
  end if;

  v_shipping_charge := case when p_delivery_option = 'express' then 150 else 0 end;
  v_tax := round(v_subtotal * 0.05, 2);
  v_total := greatest(v_subtotal + v_shipping_charge + v_tax - v_coupon_discount - v_member_discount, 0);

  if p_payment_method = 'cod' then
    v_order_status := 'confirmed';
    v_payment_status := 'pending'; -- collected on delivery, outside this system
  else
    v_order_status := 'pending_payment';
    v_payment_status := 'created'; -- Phase 6 payment flow takes it from here
  end if;

  insert into public.orders (
    user_id, status, subtotal, discount, shipping_charge, tax, total_amount,
    payment_status, payment_method, coupon_code,
    shipping_address_snapshot, billing_address_snapshot, idempotency_key
  ) values (
    v_user_id, v_order_status, v_subtotal, v_coupon_discount + v_member_discount, v_shipping_charge, v_tax, v_total,
    v_payment_status, p_payment_method, v_coupon->>'code',
    p_shipping_address, coalesce(p_billing_address, p_shipping_address), p_idempotency_key
  )
  returning id, order_number into v_order_id, v_order_number;

  -- Pass 2: now that the order row exists, reserve stock and write
  -- line-item snapshots. Any failure here (shouldn't happen after pass 1,
  -- but concurrent buyers could have taken the last units in between) still
  -- rolls back the whole order via the exception.
  for v_line in select * from jsonb_to_recordset(array_to_json(v_lines)::jsonb) as x(
    variant_id uuid, product_id uuid, sku text, product_name text, quantity int, unit_price numeric
  )
  loop
    v_reserved := public.reserve_stock(v_line.variant_id, v_line.quantity);
    if not v_reserved then
      raise exception 'Insufficient stock for %', v_line.product_name;
    end if;
    if p_payment_method = 'cod' then
      -- No payment gate to wait for -- the reservation becomes permanent immediately.
      perform public.commit_stock(v_line.variant_id, v_line.quantity);
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, quantity, unit_price, total
    ) values (
      v_order_id, v_line.product_id, v_line.variant_id, v_line.product_name, v_line.sku,
      v_line.quantity, v_line.unit_price, v_line.unit_price * v_line.quantity
    );
  end loop;

  if v_coupon is not null and (v_coupon->>'valid')::boolean then
    insert into public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
    values ((v_coupon->>'coupon_id')::uuid, v_user_id, v_order_id, v_coupon_discount);
  end if;

  delete from public.cart_items where cart_id = v_cart_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', v_order_status,
    'payment_status', v_payment_status,
    'total_amount', v_total,
    'already_existed', false
  );
end;
$$;
