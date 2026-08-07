-- Generic, DB-level rate limiting -- appropriate for this scale (2-3k
-- orders/month) without pulling in external infra (Redis/Upstash) just to
-- count recent attempts. Login/signup/password-reset/OTP are already
-- rate-limited natively by Supabase Auth (configurable in the dashboard
-- under Auth > Rate Limits) and aren't duplicated here.
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_key_created_idx on public.rate_limit_events(key, created_at);

create or replace function public.check_rate_limit(p_key text, p_max_attempts int, p_window_seconds int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.rate_limit_events
  where key = p_key and created_at > now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_attempts then
    raise exception 'Too many attempts. Please wait a moment and try again.';
  end if;

  insert into public.rate_limit_events (key) values (p_key);
end;
$$;

-- Internal building block, not something a client should call with an
-- arbitrary key of its own choosing.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;

-- Without RLS here, PostgREST's default table grants would let any
-- authenticated/anon caller read or directly manipulate this table
-- (e.g. delete their own recent attempts to dodge the limit) even with
-- check_rate_limit() itself locked down. Staff can read for debugging;
-- nobody gets direct write access -- only the SECURITY DEFINER function
-- (which bypasses RLS) writes to it.
alter table public.rate_limit_events enable row level security;

create policy "rate_limit_events_staff_read" on public.rate_limit_events
  for select using (public.is_staff());

-- Re-issued with a rate-limit check added right after the idempotency
-- short-circuit (so a legitimate retry of an already-created order never
-- burns rate-limit budget) and before any stock is touched.
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
  v_member_discount numeric := 150;
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

  perform public.check_rate_limit('checkout:' || v_user_id::text, 5, 60);

  select id into v_cart_id from public.carts where user_id = v_user_id;
  if v_cart_id is null then
    raise exception 'cart is empty';
  end if;

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
    v_payment_status := 'pending';
  else
    v_order_status := 'pending_payment';
    v_payment_status := 'created';
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

  for v_line in select * from jsonb_to_recordset(array_to_json(v_lines)::jsonb) as x(
    variant_id uuid, product_id uuid, sku text, product_name text, quantity int, unit_price numeric
  )
  loop
    v_reserved := public.reserve_stock(v_line.variant_id, v_line.quantity);
    if not v_reserved then
      raise exception 'Insufficient stock for %', v_line.product_name;
    end if;
    if p_payment_method = 'cod' then
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

-- Re-issued with a rate-limit check -- coupon codes are guessable strings,
-- and without this a client could brute-force enumerate valid codes by
-- hammering this endpoint.
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

  perform public.check_rate_limit('coupon:' || auth.uid()::text, 10, 60);

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

-- Re-issued with a rate-limit check on new review submissions (not edits --
-- reviews_enforce_integrity already resets status to 'pending' on UPDATE,
-- this only guards INSERT spam) for non-staff callers.
create or replace function public.reviews_enforce_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform public.check_rate_limit('review:' || auth.uid()::text, 10, 3600);
  end if;

  if new.order_id is not null and not exists (
    select 1 from public.orders o
    where o.id = new.order_id and o.user_id = new.user_id
  ) then
    new.order_id = null;
  end if;

  new.verified_purchase = exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = new.user_id
      and oi.product_id = new.product_id
      and o.status = 'delivered'
  );

  new.status = 'pending';

  return new;
end;
$$;
