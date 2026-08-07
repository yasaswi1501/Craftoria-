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
