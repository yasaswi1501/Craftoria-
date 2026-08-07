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
