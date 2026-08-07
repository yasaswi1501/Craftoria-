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
