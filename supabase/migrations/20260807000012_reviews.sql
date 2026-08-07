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
