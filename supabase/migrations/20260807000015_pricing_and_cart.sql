-- Single authoritative price resolver: variant-level override wins, then the
-- product's sale price, then its base price. Every place that needs a price
-- (cart totals, checkout, order creation in Phase 5) calls this instead of
-- trusting anything the client sends.
create or replace function public.get_variant_price(p_variant_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(pv.price_override, p.sale_price, p.base_price)
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = p_variant_id;
$$;

create or replace function public.get_or_create_cart()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select id into v_cart_id from public.carts where user_id = auth.uid();
  if v_cart_id is null then
    insert into public.carts (user_id) values (auth.uid()) returning id into v_cart_id;
  end if;
  return v_cart_id;
end;
$$;

-- Adds to the existing line if the variant is already in the cart
-- (increment, not replace) -- this is what makes rapid double-clicks and
-- re-adding an already-cart'd item behave correctly instead of racing.
create or replace function public.cart_add_item(p_variant_id uuid, p_quantity int default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_active boolean;
begin
  if p_quantity <= 0 then
    raise exception 'quantity must be positive';
  end if;

  select pv.active and p.active into v_active
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = p_variant_id;

  if v_active is null then
    raise exception 'product variant not found';
  end if;
  if not v_active then
    raise exception 'product is no longer available';
  end if;

  v_cart_id := public.get_or_create_cart();

  insert into public.cart_items (cart_id, variant_id, quantity)
  values (v_cart_id, p_variant_id, p_quantity)
  on conflict (cart_id, variant_id)
  do update set quantity = public.cart_items.quantity + excluded.quantity;

  update public.carts set updated_at = now() where id = v_cart_id;
end;
$$;

-- Absolute set (not increment) -- what the +/- stepper UI calls. 0 or below removes the line.
create or replace function public.cart_set_item_quantity(p_variant_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
begin
  v_cart_id := public.get_or_create_cart();

  if p_quantity <= 0 then
    delete from public.cart_items where cart_id = v_cart_id and variant_id = p_variant_id;
  else
    insert into public.cart_items (cart_id, variant_id, quantity)
    values (v_cart_id, p_variant_id, p_quantity)
    on conflict (cart_id, variant_id) do update set quantity = excluded.quantity;
  end if;

  update public.carts set updated_at = now() where id = v_cart_id;
end;
$$;

create or replace function public.cart_remove_item(p_variant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
begin
  v_cart_id := public.get_or_create_cart();
  delete from public.cart_items where cart_id = v_cart_id and variant_id = p_variant_id;
  update public.carts set updated_at = now() where id = v_cart_id;
end;
$$;

create or replace function public.cart_clear()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
begin
  v_cart_id := public.get_or_create_cart();
  delete from public.cart_items where cart_id = v_cart_id;
end;
$$;

-- Authoritative cart contents + totals in one round trip: every price in
-- here is resolved server-side via get_variant_price, never from the client.
create or replace function public.get_cart_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with cart as (
    select id from public.carts where user_id = auth.uid()
  ),
  lines as (
    select
      ci.variant_id,
      pv.sku,
      p.id as product_id,
      p.slug as product_slug,
      p.name as product_name,
      p.description as product_description,
      p.active and pv.active as is_available,
      inv.available_quantity,
      ci.quantity,
      public.get_variant_price(ci.variant_id) as unit_price
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id and c.user_id = auth.uid()
    join public.product_variants pv on pv.id = ci.variant_id
    join public.products p on p.id = pv.product_id
    left join public.inventory inv on inv.product_variant_id = ci.variant_id
    order by ci.created_at
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'variant_id', variant_id,
      'sku', sku,
      'product_id', product_id,
      'product_slug', product_slug,
      'product_name', product_name,
      'product_description', product_description,
      'is_available', is_available,
      'available_quantity', available_quantity,
      'quantity', quantity,
      'unit_price', unit_price,
      'line_total', unit_price * quantity
    )), '[]'::jsonb),
    'subtotal', coalesce(sum(unit_price * quantity), 0)
  )
  from lines;
$$;

-- Server-side coupon validation -- the discount amount the client sees here
-- is always recomputed, never accepted as-is at checkout (Phase 5 re-runs
-- this same function rather than trusting whatever the cart preview showed).
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons%rowtype;
  v_discount numeric;
  v_user_usage_count int;
begin
  if auth.uid() is null then
    return jsonb_build_object('valid', false, 'message', 'Please log in to apply a coupon.');
  end if;

  select * into v_coupon from public.coupons where upper(code) = upper(p_code);

  if v_coupon.id is null then
    return jsonb_build_object('valid', false, 'message', 'Invalid coupon code.');
  end if;
  if not v_coupon.active then
    return jsonb_build_object('valid', false, 'message', 'This coupon is no longer active.');
  end if;
  if v_coupon.start_at > now() then
    return jsonb_build_object('valid', false, 'message', 'This coupon is not active yet.');
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at <= now() then
    return jsonb_build_object('valid', false, 'message', 'This coupon has expired.');
  end if;
  if p_subtotal < v_coupon.minimum_order_amount then
    return jsonb_build_object('valid', false, 'message',
      format('Minimum order amount for this coupon is ₹%s.', v_coupon.minimum_order_amount));
  end if;

  if v_coupon.usage_limit is not null then
    if (select count(*) from public.coupon_usage where coupon_id = v_coupon.id) >= v_coupon.usage_limit then
      return jsonb_build_object('valid', false, 'message', 'This coupon has reached its usage limit.');
    end if;
  end if;

  select count(*) into v_user_usage_count
  from public.coupon_usage
  where coupon_id = v_coupon.id and user_id = auth.uid();

  if v_user_usage_count >= v_coupon.per_user_limit then
    return jsonb_build_object('valid', false, 'message', 'You have already used this coupon.');
  end if;

  if v_coupon.discount_type = 'percentage' then
    v_discount := round(p_subtotal * v_coupon.discount_value / 100, 2);
  else
    v_discount := v_coupon.discount_value;
  end if;

  if v_coupon.maximum_discount is not null and v_discount > v_coupon.maximum_discount then
    v_discount := v_coupon.maximum_discount;
  end if;
  if v_discount > p_subtotal then
    v_discount := p_subtotal;
  end if;

  return jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_amount', v_discount,
    'message', 'Coupon applied.'
  );
end;
$$;
