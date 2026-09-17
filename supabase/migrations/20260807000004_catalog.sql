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

-- Gated on the parent product's `active` flag (like every other catalog
-- table here) so an inactive/unpublished product's image URLs aren't
-- readable by guessing/enumerating a product_id.
create policy "product_images_public_read" on public.product_images
  for select using (
    public.is_staff() or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.active
    )
  );
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());
