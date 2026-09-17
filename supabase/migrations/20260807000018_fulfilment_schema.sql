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
