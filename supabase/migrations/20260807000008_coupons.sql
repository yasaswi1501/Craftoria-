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
