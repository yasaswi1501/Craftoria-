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
