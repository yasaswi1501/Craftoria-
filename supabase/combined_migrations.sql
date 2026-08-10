-- ============================================================
-- 20260807000001_extensions_and_helpers.sql
-- ============================================================
-- Extensions & generic helpers used across every later migration.

create extension if not exists pgcrypto;

-- Generic updated_at maintenance, attached per-table via trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 20260807000002_profiles_and_roles.sql
-- ============================================================
-- profiles: 1:1 extension of auth.users, plus the role model authorization is built on.

create type public.user_role as enum ('customer', 'admin', 'super_admin', 'support', 'inventory_manager');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role-check helpers used by RLS policies on every later table.
-- SECURITY DEFINER + fixed search_path so these bypass RLS on `profiles` internally
-- (a policy on profiles that queries profiles directly would recurse otherwise)
-- and can't be hijacked via a malicious search_path.
create or replace function public.current_role_name()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role_name() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role_name() in ('admin', 'super_admin', 'support', 'inventory_manager'), false);
$$;

-- Auto-create a profile row the moment a new auth.users row appears
-- (email/password signup, Google OAuth, doesn't matter which).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A user can never grant themselves (or anyone) a higher role by updating
-- their own row. Trusted server-side tooling (the service-role key -- an
-- admin dashboard backend, support tooling, bootstrapping the first admin)
-- is exempt: triggers run regardless of BYPASSRLS (that flag only affects
-- row-security policies, not triggers), so without this explicit check
-- there would be no way to ever promote a user's role at all, even from a
-- fully trusted server context.
--
-- Checked via the JWT role claim GUC (the same mechanism auth.uid() reads
-- for `sub`), not current_user/session_user: this function is SECURITY
-- DEFINER, so current_user is already overridden to the function's owner
-- by the time this body runs, and session_user reflects PostgREST's fixed
-- connection-pool role rather than the per-request JWT role either way.
-- GUC settings survive the SECURITY DEFINER context switch, which is
-- exactly why they're the right thing to check here.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- No insert/delete policy for regular clients: rows are created only by the
-- handle_new_user trigger (SECURITY DEFINER, bypasses RLS) and deleted via
-- the auth.users cascade. Admin tooling can still act via the service role.


-- ============================================================
-- 20260807000003_addresses.sql
-- ============================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  address_type text not null default 'home' check (address_type in ('home', 'work', 'other')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses(user_id);

-- Only one default address per user.
create unique index addresses_one_default_per_user
  on public.addresses(user_id)
  where is_default;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;

create policy "addresses_select_own_or_staff"
  on public.addresses for select
  using (user_id = auth.uid() or public.is_staff());

create policy "addresses_insert_own"
  on public.addresses for insert
  with check (user_id = auth.uid());

create policy "addresses_update_own"
  on public.addresses for update
  using (user_id = auth.uid());

create policy "addresses_delete_own"
  on public.addresses for delete
  using (user_id = auth.uid());


-- ============================================================
-- 20260807000004_catalog.sql
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_category_id uuid references public.categories(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index categories_parent_idx on public.categories(parent_category_id);
create index categories_active_idx on public.categories(active);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  brand text,
  base_price numeric(10, 2) not null check (base_price >= 0),
  sale_price numeric(10, 2) check (sale_price is null or (sale_price >= 0 and sale_price <= base_price)),
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products(category_id);
create index products_active_idx on public.products(active);
create index products_slug_idx on public.products(slug);
create index products_featured_idx on public.products(featured) where featured;

-- Full text search now, cheap to extend to Typesense/Meilisearch later without a schema change.
alter table public.products add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored;

create index products_search_idx on public.products using gin(search_vector);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Every product has >=1 variant, even if it has no real size/color options
-- ("Default" variant) -- this keeps cart/order/inventory keyed on variant_id
-- consistently instead of branching between simple/variable products.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants(product_id);
create index product_variants_sku_idx on public.product_variants(sku);
create index product_variants_active_idx on public.product_variants(active);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  image_url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id);
create index product_images_variant_idx on public.product_images(variant_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- Public catalog browsing needs no auth at all.
create policy "categories_public_read_active" on public.categories
  for select using (active or public.is_staff());
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read_active" on public.products
  for select using (active or public.is_staff());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_variants_public_read_active" on public.product_variants
  for select using (active or public.is_staff());
create policy "product_variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images_public_read" on public.product_images
  for select using (true);
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());


-- ============================================================
-- 20260807000005_inventory.sql
-- ============================================================
-- Single source of truth for stock. (product_variants intentionally has no
-- stock_quantity column of its own -- two counters that can drift is worse
-- than one table you always join to.)
create table public.inventory (
  product_variant_id uuid primary key references public.product_variants(id) on delete cascade,
  available_quantity int not null default 0 check (available_quantity >= 0),
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold int not null default 5,
  updated_at timestamptz not null default now()
);

create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- New variant => new inventory row (0 stock until an admin sets it).
create or replace function public.handle_new_variant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory (product_variant_id, available_quantity)
  values (new.id, 0)
  on conflict (product_variant_id) do nothing;
  return new;
end;
$$;

create trigger on_product_variant_created
  after insert on public.product_variants
  for each row execute function public.handle_new_variant();

-- Row-locked, atomic. Called from the checkout RPC (Phase 5) -- never
-- exposed directly to clients, see the revoke statements below.
create or replace function public.reserve_stock(p_variant_id uuid, p_quantity int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
begin
  if p_quantity <= 0 then
    raise exception 'quantity must be positive';
  end if;

  select available_quantity into v_available
  from public.inventory
  where product_variant_id = p_variant_id
  for update;

  if v_available is null or v_available < p_quantity then
    return false;
  end if;

  update public.inventory
  set available_quantity = available_quantity - p_quantity,
      reserved_quantity = reserved_quantity + p_quantity
  where product_variant_id = p_variant_id;

  return true;
end;
$$;

-- Reservation didn't convert to a paid order (payment failed/cancelled/expired).
create or replace function public.release_stock(p_variant_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory
  set available_quantity = available_quantity + p_quantity,
      reserved_quantity = greatest(reserved_quantity - p_quantity, 0)
  where product_variant_id = p_variant_id;
end;
$$;

-- Payment confirmed: the reservation becomes a permanent deduction.
create or replace function public.commit_stock(p_variant_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory
  set reserved_quantity = greatest(reserved_quantity - p_quantity, 0)
  where product_variant_id = p_variant_id;
end;
$$;

-- Cancellation/return after a paid order, or an admin manually adding stock.
create or replace function public.restock(p_variant_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory
  set available_quantity = available_quantity + p_quantity
  where product_variant_id = p_variant_id;
end;
$$;

-- These are building blocks for higher-level RPCs (checkout, admin inventory
-- tools), not something a client should ever call directly -- an
-- unauthenticated reserve_stock loop would be a stock-lockup DoS.
-- Revoking from `public` alone is not enough on Supabase: the project's
-- default privileges grant EXECUTE on new functions directly to `anon` and
-- `authenticated`, independent of the PUBLIC pseudo-role, so both must be
-- revoked explicitly or these stay callable over the API.
revoke execute on function public.reserve_stock(uuid, int) from public, anon, authenticated;
revoke execute on function public.release_stock(uuid, int) from public, anon, authenticated;
revoke execute on function public.commit_stock(uuid, int) from public, anon, authenticated;
revoke execute on function public.restock(uuid, int) from public, anon, authenticated;

alter table public.inventory enable row level security;

-- reserved_quantity/low_stock_threshold are operational detail, not for
-- public consumption -- the raw table is staff-only.
create policy "inventory_staff_read" on public.inventory
  for select using (public.is_staff());
create policy "inventory_staff_write" on public.inventory
  for all using (public.is_staff()) with check (public.is_staff());

-- Product pages only need "is this in stock / how many". security_invoker=false
-- is deliberate: this view must run as its owner to expose that one safe
-- column despite the staff-only RLS policy on the underlying table above.
create view public.inventory_public
  with (security_invoker = false) as
  select product_variant_id, available_quantity
  from public.inventory;

grant select on public.inventory_public to anon, authenticated;


-- ============================================================
-- 20260807000006_cart.sql
-- ============================================================
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_cart_idx on public.cart_items(cart_id);
create index cart_items_variant_idx on public.cart_items(variant_id);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "carts_owner_all" on public.carts
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid());

create policy "cart_items_owner_all" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff()))
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );


-- ============================================================
-- 20260807000007_wishlist.sql
-- ============================================================
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

create index wishlist_items_wishlist_idx on public.wishlist_items(wishlist_id);
create index wishlist_items_product_idx on public.wishlist_items(product_id);

alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;

create policy "wishlists_owner_all" on public.wishlists
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "wishlist_items_owner_all" on public.wishlist_items
  for all using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  );


-- ============================================================
-- 20260807000008_coupons.sql
-- ============================================================
create type public.coupon_discount_type as enum ('percentage', 'fixed');

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.coupon_discount_type not null,
  discount_value numeric(10, 2) not null check (discount_value > 0),
  minimum_order_amount numeric(10, 2) not null default 0 check (minimum_order_amount >= 0),
  maximum_discount numeric(10, 2) check (maximum_discount is null or maximum_discount >= 0),
  usage_limit int check (usage_limit is null or usage_limit > 0),
  per_user_limit int not null default 1 check (per_user_limit > 0),
  start_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percentage_range check (discount_type <> 'percentage' or discount_value <= 100),
  constraint coupons_dates_ordered check (expires_at is null or expires_at > start_at)
);

create index coupons_code_idx on public.coupons(upper(code));
create index coupons_active_idx on public.coupons(active);

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;

-- Coupon codes are only useful if the client can look them up to show
-- "10% off" copy, but only the active/current ones -- inactive/expired
-- rows and admin-only fields (usage_limit etc.) stay staff-only via the
-- second policy narrowing what active=false / staff-only rows are visible.
create policy "coupons_public_read_active" on public.coupons
  for select using (
    (active and (expires_at is null or expires_at > now()) and start_at <= now())
    or public.is_staff()
  );
create policy "coupons_admin_write" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());


-- ============================================================
-- 20260807000009_orders.sql
-- ============================================================
create type public.order_status as enum (
  'pending_payment', 'confirmed', 'processing', 'packed', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'return_requested',
  'returned', 'refunded'
);

create type public.payment_status as enum (
  'created', 'pending', 'authorized', 'paid', 'failed',
  'cancelled', 'refunded', 'partially_refunded'
);

create sequence public.order_number_seq;

create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'CR-' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_number text not null unique default public.generate_order_number(),
  status public.order_status not null default 'pending_payment',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  shipping_charge numeric(10, 2) not null default 0 check (shipping_charge >= 0),
  tax numeric(10, 2) not null default 0 check (tax >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  payment_status public.payment_status not null default 'created',
  payment_method text,
  coupon_code text,
  shipping_address_snapshot jsonb not null,
  billing_address_snapshot jsonb not null,
  -- Set by the checkout RPC from a client-supplied idempotency key so a
  -- double "Place Order" tap/retry can never create two paid orders.
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_order_number_idx on public.orders(order_number);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  -- Snapshots: historical orders must read the same forever, even if the
  -- live product is renamed, repriced, or deleted.
  product_name text not null,
  sku text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  tax numeric(10, 2) not null default 0 check (tax >= 0),
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history(order_id);

-- Every status change is appended here too, not just written to orders.status,
-- so the timeline the customer/admin sees can never silently lose a step.
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_log_status_change
  after insert or update on public.orders
  for each row execute function public.log_order_status_change();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

create policy "orders_select_own_or_staff" on public.orders
  for select using (user_id = auth.uid() or public.is_staff());

create policy "order_items_select_own_or_staff" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );

create policy "order_status_history_select_own_or_staff" on public.order_status_history
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );

-- Deliberately no insert/update/delete policies for orders/order_items here:
-- creation happens only via the checkout RPC (Phase 5) and status transitions
-- only via admin RPCs (Phase 8), both SECURITY DEFINER and both bypassing RLS
-- by design. Direct table writes from the client are never allowed.


-- ============================================================
-- 20260807000010_coupon_usage.sql
-- ============================================================
create table public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  discount_amount numeric(10, 2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create index coupon_usage_coupon_idx on public.coupon_usage(coupon_id);
create index coupon_usage_user_idx on public.coupon_usage(user_id);

-- Fast "has this user already used this coupon N times" lookups for the
-- per_user_limit check inside the checkout RPC (Phase 5).
create index coupon_usage_coupon_user_idx on public.coupon_usage(coupon_id, user_id);

alter table public.coupon_usage enable row level security;

create policy "coupon_usage_select_own_or_staff" on public.coupon_usage
  for select using (user_id = auth.uid() or public.is_staff());

-- Written only by the checkout RPC (SECURITY DEFINER) -- coupon consumption
-- must never be a direct client insert, or the per-user/global limits mean nothing.


-- ============================================================
-- 20260807000011_payments.sql
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null default 'razorpay',
  provider_payment_id text,
  provider_order_id text,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'created',
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_provider_payment_id_idx
  on public.payments(provider, provider_payment_id) where provider_payment_id is not null;
create unique index payments_provider_order_id_idx
  on public.payments(provider, provider_order_id) where provider_order_id is not null;
create index payments_order_idx on public.payments(order_id);
create index payments_user_idx on public.payments(user_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Raw webhook deliveries. provider_event_id unique is the idempotency guard:
-- Razorpay (like most gateways) can and does redeliver the same webhook, and
-- this table is what lets Phase 6's handler tell "already processed" from "new".
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  payment_id uuid references public.payments(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index payment_events_order_idx on public.payment_events(order_id);
create index payment_events_processed_idx on public.payment_events(processed);

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

create policy "payments_select_own_or_staff" on public.payments
  for select using (user_id = auth.uid() or public.is_staff());

-- No policies at all for payment_events: it's written/read exclusively by
-- the Edge Function webhook handler using the service-role key, which
-- bypasses RLS entirely. Nothing in this table should ever reach a browser.

-- No insert/update policies on payments either: rows are created by the
-- checkout RPC and updated only by the service-role webhook handler. A
-- client claiming "status: paid" from the browser must never be trusted.


-- ============================================================
-- 20260807000012_reviews.sql
-- ============================================================
create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  review text,
  verified_purchase boolean not null default false,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index reviews_product_idx on public.reviews(product_id);
create index reviews_status_idx on public.reviews(status);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- verified_purchase and status are never taken from the client: this trigger
-- recomputes them server-side from actual delivered order history every time.
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

  -- A non-staff author can't claim someone else's order, and can't set
  -- verified_purchase or approval status themselves.
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

  -- Editing an existing review sends it back through moderation.
  new.status = 'pending';

  return new;
end;
$$;

create trigger reviews_before_write
  before insert or update on public.reviews
  for each row execute function public.reviews_enforce_integrity();

alter table public.reviews enable row level security;

create policy "reviews_select_approved_or_own_or_staff" on public.reviews
  for select using (status = 'approved' or user_id = auth.uid() or public.is_staff());

create policy "reviews_insert_own" on public.reviews
  for insert with check (user_id = auth.uid());

create policy "reviews_update_own_or_staff" on public.reviews
  for update using (user_id = auth.uid() or public.is_staff());

create policy "reviews_delete_own_or_staff" on public.reviews
  for delete using (user_id = auth.uid() or public.is_staff());


-- ============================================================
-- 20260807000013_notifications.sql
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id);
create index notifications_user_unread_idx on public.notifications(user_id) where not read;

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

create policy "notifications_insert_staff" on public.notifications
  for insert with check (public.is_staff());

-- Most notification rows (order confirmed, payment received, shipped, ...)
-- are written by the service-role Edge Functions in later phases, which
-- bypass RLS entirely -- the staff insert policy above only covers
-- admin-triggered broadcasts done from an authenticated admin session.


-- ============================================================
-- 20260807000014_audit_logs.sql
-- ============================================================
-- Append-only. No update/delete policy for anyone -- an audit trail that can
-- be edited or erased by the same admins it's supposed to be watching isn't one.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_staff" on public.audit_logs
  for select using (public.is_staff());

create policy "audit_logs_insert_staff" on public.audit_logs
  for insert with check (public.is_staff());

-- Convenience wrapper for the admin RPCs written in Phase 8. SECURITY
-- DEFINER so it works the same way whether called by an admin session or
-- internally by another SECURITY DEFINER function.
create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_value jsonb default null,
  p_new_value jsonb default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_value, p_new_value, p_metadata);
end;
$$;

-- Internal-only: called from other SECURITY DEFINER admin RPCs (Phase 8),
-- which don't need their own EXECUTE grant to invoke it -- they run as the
-- function owner. Never exposed as a directly callable RPC, or any logged-in
-- customer could insert fabricated entries into the audit trail.
-- (Revoking from anon/authenticated explicitly, not just `public`, because
-- Supabase's default privileges grant EXECUTE on new functions directly to
-- those roles regardless of the PUBLIC pseudo-role.)
revoke execute on function public.write_audit_log(text, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;


-- ============================================================
-- 20260807000015_pricing_and_cart.sql
-- ============================================================
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


-- ============================================================
-- 20260807000016_checkout.sql
-- ============================================================
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


-- ============================================================
-- 20260807000017_payment_confirmation.sql
-- ============================================================
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


-- ============================================================
-- 20260807000018_fulfilment_schema.sql
-- ============================================================
-- Shipments: one per order for now (no split shipments). Kept deliberately
-- thin -- courier/tracking_number are plain fields an admin can set by hand
-- today; a real courier API integration later would populate the same
-- columns from its own webhooks without a schema change.
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  courier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  estimated_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

create type public.return_status as enum ('requested', 'approved', 'rejected', 'picked_up', 'received', 'refunded');

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  images text[] default '{}',
  status public.return_status not null default 'requested',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index returns_order_idx on public.returns(order_id);
create index returns_user_idx on public.returns(user_id);
create index returns_status_idx on public.returns(status);

create trigger returns_set_updated_at
  before update on public.returns
  for each row execute function public.set_updated_at();

create type public.refund_status as enum ('requires_review', 'initiated', 'processing', 'completed', 'failed');

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  return_id uuid references public.returns(id) on delete set null,
  amount numeric(10, 2) not null check (amount >= 0),
  reason text,
  status public.refund_status not null default 'requires_review',
  provider text,
  provider_refund_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index refunds_order_idx on public.refunds(order_id);
create index refunds_status_idx on public.refunds(status);

create trigger refunds_set_updated_at
  before update on public.refunds
  for each row execute function public.set_updated_at();

-- Invoice numbering ledger. Content (line items, addresses, totals) is
-- computed on demand from orders/order_items/profiles at render time --
-- those are already the immutable snapshot, duplicating them here would
-- just be a second copy that can drift.
create sequence public.invoice_number_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  invoice_number text not null unique default (
    'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0')
  ),
  -- Nullable placeholders so GST fields can be populated later without a
  -- migration -- this is not a full GST implementation (no CGST/SGST/IGST
  -- split), just room for it.
  seller_gstin text,
  place_of_supply text,
  issued_at timestamptz not null default now()
);

create index invoices_order_idx on public.invoices(order_id);

alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.refunds enable row level security;
alter table public.invoices enable row level security;

create policy "shipments_select_own_or_staff" on public.shipments
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );
create policy "shipments_staff_write" on public.shipments
  for all using (public.is_staff()) with check (public.is_staff());

create policy "returns_select_own_or_staff" on public.returns
  for select using (user_id = auth.uid() or public.is_staff());
create policy "returns_staff_write" on public.returns
  for update using (public.is_staff()) with check (public.is_staff());
-- No client insert policy: returns are created only via the request_return
-- RPC below, which validates the order is actually eligible (delivered,
-- owned by the caller) before writing anything.

create policy "refunds_select_own_or_staff" on public.refunds
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );
create policy "refunds_staff_write" on public.refunds
  for all using (public.is_staff()) with check (public.is_staff());

create policy "invoices_select_own_or_staff" on public.invoices
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );
-- No client write policy: invoices are only ever created by the trigger below.


-- ============================================================
-- 20260807000019_fulfilment_automation.sql
-- ============================================================
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


-- ============================================================
-- 20260807000020_fulfilment_customer_rpcs.sql
-- ============================================================
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


-- ============================================================
-- 20260807000021_fulfilment_staff_rpcs.sql
-- ============================================================
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


-- ============================================================
-- 20260807000022_refund_confirmation.sql
-- ============================================================
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


-- ============================================================
-- 20260807000023_admin_audit_triggers.sql
-- ============================================================
-- Generic audit trigger for tables admins write to directly via RLS
-- (products, variants, categories, coupons -- see the *_admin_write
-- policies from Phase 2). UPDATE/DELETE only, not INSERT: routine catalog
-- setup (seeding, adding new SKUs) would otherwise spam the log, whereas
-- "a price silently changed" or "a coupon got deleted" is exactly the kind
-- of thing this table exists to catch. Orders/returns/refunds already get
-- audited by their own dedicated RPCs (Phase 7), which capture more
-- specific context than a generic row diff would.
create or replace function public.audit_table_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- old is always available here (this trigger only ever fires for UPDATE
  -- or DELETE, never INSERT); new is null on DELETE.
  perform public.write_audit_log(
    tg_table_name || '_' || lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id)::text,
    to_jsonb(old),
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    null
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger products_audit_write
  after update or delete on public.products
  for each row execute function public.audit_table_write();

create trigger product_variants_audit_write
  after update or delete on public.product_variants
  for each row execute function public.audit_table_write();

create trigger categories_audit_write
  after update or delete on public.categories
  for each row execute function public.audit_table_write();

create trigger coupons_audit_write
  after update or delete on public.coupons
  for each row execute function public.audit_table_write();

-- Role changes get their own trigger rather than relying on the generic one
-- above (profiles isn't in that list -- most profile edits are just a user
-- updating their own name/phone, which isn't audit-worthy). Only the role
-- column matters here.
create or replace function public.audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    perform public.write_audit_log(
      'profile_role_change',
      'profile',
      new.id::text,
      jsonb_build_object('role', old.role),
      jsonb_build_object('role', new.role),
      null
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_role_change
  after update on public.profiles
  for each row execute function public.audit_role_change();


-- ============================================================
-- 20260807000024_admin_inventory.sql
-- ============================================================
-- Staff-facing stock adjustment (new shipment arrived, damaged-goods
-- write-off, stock count correction). Deliberately separate from the
-- reserve_stock/commit_stock/release_stock trio (Phase 2) -- those exist to
-- keep the checkout path race-free and are internal-only; this is a manual,
-- audited correction to available_quantity, not part of any order flow.
create or replace function public.admin_adjust_inventory(
  p_variant_id uuid,
  p_delta int,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before int;
  v_after int;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;
  if p_delta = 0 then
    raise exception 'delta must be non-zero';
  end if;

  select available_quantity into v_before from public.inventory where product_variant_id = p_variant_id for update;
  if not found then
    raise exception 'Inventory row not found for variant %', p_variant_id;
  end if;

  v_after := v_before + p_delta;
  if v_after < 0 then
    raise exception 'Adjustment would take available stock negative (currently %, delta %)', v_before, p_delta;
  end if;

  update public.inventory set available_quantity = v_after where product_variant_id = p_variant_id;

  perform public.write_audit_log(
    'inventory_adjusted', 'inventory', p_variant_id::text,
    jsonb_build_object('available_quantity', v_before),
    jsonb_build_object('available_quantity', v_after),
    jsonb_build_object('delta', p_delta, 'reason', p_reason)
  );

  return jsonb_build_object('variant_id', p_variant_id, 'available_quantity', v_after);
end;
$$;


-- ============================================================
-- 20260807000025_admin_reviews.sql
-- ============================================================
create or replace function public.admin_moderate_review(
  p_review_id uuid,
  p_decision public.review_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status public.review_status;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  select status into v_old_status from public.reviews where id = p_review_id;
  if not found then
    raise exception 'Review not found';
  end if;

  -- Direct UPDATE, not through reviews_before_write's is_staff() branch
  -- concerns: that trigger already lets staff set status freely (see Phase
  -- 2), this RPC just adds the authorization message + audit trail.
  update public.reviews set status = p_decision where id = p_review_id;

  perform public.write_audit_log(
    'review_moderated', 'review', p_review_id::text,
    jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_decision), null
  );

  return jsonb_build_object('review_id', p_review_id, 'status', p_decision);
end;
$$;


-- ============================================================
-- 20260807000026_admin_reports.sql
-- ============================================================
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'total_orders', (select count(*) from public.orders),
    'orders_today', (select count(*) from public.orders where created_at >= current_date),
    'pending_orders', (select count(*) from public.orders where status in ('pending_payment', 'confirmed', 'processing')),
    'total_revenue', (select coalesce(sum(total_amount), 0) from public.orders where payment_status in ('paid', 'partially_refunded')),
    'revenue_today', (select coalesce(sum(total_amount), 0) from public.orders where payment_status = 'paid' and created_at >= current_date),
    'pending_returns', (select count(*) from public.returns where status = 'requested'),
    'pending_refunds', (select count(*) from public.refunds where status in ('requires_review', 'initiated', 'processing')),
    'low_stock_count', (select count(*) from public.inventory where available_quantity <= low_stock_threshold)
  );
end;
$$;

-- Feeds the "low-stock admin alerts" surface from the notification
-- architecture spec -- a simple polled read rather than a standing
-- notification row per product, so it always reflects live stock instead
-- of going stale.
create or replace function public.admin_low_stock_products()
returns table (
  variant_id uuid,
  sku text,
  product_name text,
  available_quantity int,
  low_stock_threshold int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select pv.id, pv.sku, p.name, inv.available_quantity, inv.low_stock_threshold
  from public.inventory inv
  join public.product_variants pv on pv.id = inv.product_variant_id
  join public.products p on p.id = pv.product_id
  where inv.available_quantity <= inv.low_stock_threshold
  order by inv.available_quantity asc;
end;
$$;


-- ============================================================
-- 20260807000027_rate_limiting.sql
-- ============================================================
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


-- ============================================================
-- 20260807000028_missing_fk_indexes.sql
-- ============================================================
-- Postgres does not auto-index foreign key columns the way it does primary
-- keys. Found via a systematic sweep of every FK in the schema against
-- pg_index, not by intuition -- these are the 7 that were missing a
-- covering index, which matters for join performance and for how
-- efficiently ON DELETE CASCADE/SET NULL can find dependent rows.
create index order_items_variant_idx on public.order_items(variant_id);
create index order_status_history_changed_by_idx on public.order_status_history(changed_by);
create index coupon_usage_order_idx on public.coupon_usage(order_id);
create index payment_events_payment_idx on public.payment_events(payment_id);
create index reviews_order_idx on public.reviews(order_id);
create index refunds_payment_idx on public.refunds(payment_id);
create index refunds_return_idx on public.refunds(return_id);


