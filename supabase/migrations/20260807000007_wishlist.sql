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
