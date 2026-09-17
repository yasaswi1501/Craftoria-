-- Adds the pieces the admin CMS needs that didn't exist yet:
--   1. customization_groups / customization_options -- replaces the
--      hardcoded option lists in src/data/customizationOptions.js
--      (CRAFT_STYLES_BY_CATEGORY, MATERIALS, COLOURS, SIZES) with an
--      admin-editable table so new options don't require a code change.
--   2. app_settings -- a small admin-editable config store, seeded with
--      the WhatsApp destination number so it's no longer only a source
--      constant (src/utils/whatsapp.js). Deliberately NOT a place for
--      secrets: publicly readable by design (the WhatsApp number is
--      already shown openly on the site), admin-write only.
--   3. products.is_custom_starting_point -- marks which product in a
--      category is the "base" for that category's bespoke /customize
--      flow, replacing the frontend's `id.startsWith('custom-')`
--      string convention with a real column.
--   4. order_items.customization_snapshot -- nullable jsonb, so a
--      WhatsApp order's selected customizations survive forever even if
--      the underlying customization_option row is later edited/deleted.
--   5. place_whatsapp_order() RPC -- the trusted, server-side pricing
--      path for the site's actual checkout flow (WhatsApp click-to-chat,
--      no payment gateway). Deliberately NOT reusing the existing
--      checkout() RPC from Phase 5/6: that function is built around a
--      Supabase-backed cart_items/product_variants/coupon/tax model this
--      app never adopted (the live cart is localStorage-only, and
--      /customize items have no real product_variant_id to key off) --
--      forcing it into service here would either error out on every
--      custom item or silently apply a member discount/tax the frontend
--      never shows. This new RPC matches what the app actually does.

-- ---- 1. Customization groups & options --------------------------------

create table public.customization_groups (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.customization_groups.category_id is
  'Null = applies to every category (e.g. "Colour", "Size"). Set = scoped to one category (e.g. "Craft / Style", which differs per category).';

create index customization_groups_category_idx on public.customization_groups(category_id);
create index customization_groups_active_idx on public.customization_groups(active);

create table public.customization_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.customization_groups(id) on delete cascade,
  label text not null,
  price_delta numeric(10, 2) not null default 0,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customization_options_group_idx on public.customization_options(group_id);
create index customization_options_active_idx on public.customization_options(active);

create trigger customization_groups_set_updated_at
  before update on public.customization_groups
  for each row execute function public.set_updated_at();
create trigger customization_options_set_updated_at
  before update on public.customization_options
  for each row execute function public.set_updated_at();

alter table public.customization_groups enable row level security;
alter table public.customization_options enable row level security;

create policy "customization_groups_public_read_active" on public.customization_groups
  for select using (active or public.is_staff());
create policy "customization_groups_admin_write" on public.customization_groups
  for all using (public.is_admin()) with check (public.is_admin());

create policy "customization_options_public_read_active" on public.customization_options
  for select using (active or public.is_staff());
create policy "customization_options_admin_write" on public.customization_options
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- 2. App settings (WhatsApp destination, etc.) ----------------------

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

comment on table public.app_settings is
  'Small admin-editable config store. Publicly readable by design -- never put secrets/credentials here, only values already safe to show a customer (WhatsApp number, etc). Service-role/API secrets stay in Supabase Edge Function secrets, never in a table.';

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

create policy "app_settings_public_read" on public.app_settings
  for select using (true);
create policy "app_settings_admin_write" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value)
values ('whatsapp_number', '"919908860895"'::jsonb)
on conflict (key) do nothing;

-- ---- 3. Mark each category's custom-order starting product -------------

alter table public.products
  add column if not exists is_custom_starting_point boolean not null default false;

create index if not exists products_custom_starting_point_idx
  on public.products(category_id) where is_custom_starting_point;

-- Admin-set display rating/review-count -- the schema already has a real
-- `reviews` table for actual customer reviews, but zero reviews exist yet
-- and there's no review-submission UI in scope here. Rather than wire up a
-- live aggregation pipeline that would show "0 reviews" on every product
-- (a regression from what the site currently displays), these are simple
-- admin-editable display values, same as the static catalog already had.
alter table public.products
  add column if not exists rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  add column if not exists review_count int not null default 0 check (review_count >= 0);

-- ---- 4. Order-time customization snapshot -------------------------------

alter table public.order_items
  add column if not exists customization_snapshot jsonb;

comment on column public.order_items.customization_snapshot is
  'Snapshot of selected customization group/option labels + price deltas, plus personalization text/notes, exactly as they were at order time -- independent of later edits to customization_options.';

-- ---- 5. place_whatsapp_order(): trusted server-side pricing + order creation

create or replace function public.place_whatsapp_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_delivery_option text default 'standard',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing record;
  v_item jsonb;
  v_product record;
  v_category record;
  v_option record;
  v_option_id uuid;
  v_unit_price numeric;
  v_quantity int;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_delivery_fee numeric;
  v_total numeric;
  v_order_id uuid;
  v_order_number text;
  v_sku text;
  v_product_name text;
  v_customization_snapshot jsonb;
  v_selected_options jsonb;
  v_item_category_id uuid;
  v_items_out jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;
  if p_shipping_address is null then
    raise exception 'shipping address is required';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required';
  end if;

  -- Idempotency: a retried submit (double-click, slow network retry) with
  -- the same key returns the order already created instead of making a
  -- second one.
  select id, order_number, status, payment_status, subtotal, shipping_charge, total_amount
  into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key and user_id = v_user_id;

  if found then
    select coalesce(jsonb_agg(jsonb_build_object(
      'product_name', oi.product_name, 'quantity', oi.quantity,
      'unit_price', oi.unit_price, 'total', oi.total,
      'customization_snapshot', oi.customization_snapshot
    )), '[]'::jsonb)
    into v_items_out
    from public.order_items oi where oi.order_id = v_existing.id;

    return jsonb_build_object(
      'order_id', v_existing.id, 'order_number', v_existing.order_number,
      'status', v_existing.status, 'payment_status', v_existing.payment_status,
      'subtotal', v_existing.subtotal, 'shipping_charge', v_existing.shipping_charge,
      'total_amount', v_existing.total_amount, 'items', v_items_out, 'already_existed', true
    );
  end if;

  create temp table _pending_items (
    product_id uuid, product_name text, sku text,
    quantity int, unit_price numeric, total numeric, customization_snapshot jsonb
  ) on commit drop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::int, 0);
    if v_quantity <= 0 or v_quantity > 50 then
      raise exception 'invalid quantity for an order item';
    end if;

    v_selected_options := coalesce(v_item->'customization_option_ids', '[]'::jsonb);

    if coalesce((v_item->>'is_custom')::boolean, false) then
      -- Ad-hoc /customize commission: priced off the category's flagged
      -- starting product + validated customization option deltas.
      select c.id, c.name into v_category
      from public.categories c
      where c.id = (v_item->>'category_id')::uuid and c.active;
      if not found then
        raise exception 'selected category is not available';
      end if;
      v_item_category_id := v_category.id;

      select p.id, p.name, coalesce(p.sale_price, p.base_price) as price
      into v_product
      from public.products p
      where p.category_id = v_category.id and p.is_custom_starting_point and p.active
      order by p.created_at asc
      limit 1;
      if not found then
        raise exception 'this category has no custom-order starting product configured';
      end if;

      v_unit_price := v_product.price;
      v_product_name := 'Custom ' || v_category.name;
      v_sku := 'CUSTOM-' || substr(gen_random_uuid()::text, 1, 8);

      v_customization_snapshot := jsonb_build_object(
        'category', v_category.name,
        'personalization_text', v_item->>'personalization_text',
        'notes', v_item->>'notes',
        'selections', '[]'::jsonb
      );
    else
      -- Real catalog product. Price is always looked up server-side --
      -- whatever "price" the client sent in p_items, if anything, is
      -- ignored entirely.
      select p.id, p.name, p.category_id, coalesce(p.sale_price, p.base_price) as price
      into v_product
      from public.products p
      where p.id = (v_item->>'product_id')::uuid and p.active;
      if not found then
        raise exception 'a product in this order is no longer available';
      end if;
      v_item_category_id := v_product.category_id;

      v_unit_price := v_product.price;
      v_product_name := v_product.name;
      v_sku := v_product.id::text;
      v_customization_snapshot := jsonb_build_object(
        'personalization_text', v_item->>'personalization_text',
        'selections', '[]'::jsonb
      );
    end if;

    -- Validate + price every selected customization option server-side,
    -- scoped correctly (global group, or a group tied to this item's
    -- category) -- an option_id that doesn't belong here is rejected
    -- rather than silently trusted.
    for v_option_id in select jsonb_array_elements_text(v_selected_options)::uuid
    loop
      select co.id, co.label, co.price_delta, cg.name as group_name
      into v_option
      from public.customization_options co
      join public.customization_groups cg on cg.id = co.group_id
      where co.id = v_option_id
        and co.active and cg.active
        and (cg.category_id is null or cg.category_id = v_item_category_id);
      if not found then
        raise exception 'a selected customization option is invalid or unavailable';
      end if;

      v_unit_price := v_unit_price + v_option.price_delta;
      v_customization_snapshot := jsonb_set(
        v_customization_snapshot, '{selections}',
        (v_customization_snapshot->'selections') || jsonb_build_object(
          'group', v_option.group_name, 'option', v_option.label, 'price_delta', v_option.price_delta
        )
      );
    end loop;

    if v_unit_price < 0 then
      raise exception 'computed item price is invalid';
    end if;

    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into _pending_items (product_id, product_name, sku, quantity, unit_price, total, customization_snapshot)
    values (v_product.id, v_product_name, v_sku, v_quantity, v_unit_price, v_line_total, v_customization_snapshot);
  end loop;

  -- Same rule as src/utils/pricing.js's calculateOrderTotals(), kept in
  -- sync deliberately so the WhatsApp/UI-displayed total this RPC returns
  -- always matches what the customer saw on screen before submitting.
  v_delivery_fee := case
    when p_delivery_option = 'express' then 150
    when v_subtotal > 0 and v_subtotal < 999 then 79
    else 0
  end;
  v_total := v_subtotal + v_delivery_fee;

  insert into public.orders (
    user_id, status, payment_status, payment_method,
    subtotal, discount, shipping_charge, tax, total_amount,
    shipping_address_snapshot, billing_address_snapshot, idempotency_key
  ) values (
    v_user_id, 'confirmed', 'pending', 'whatsapp_cod',
    v_subtotal, 0, v_delivery_fee, 0, v_total,
    p_shipping_address, p_shipping_address, p_idempotency_key
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, product_name, sku, quantity, unit_price, total, customization_snapshot)
  select v_order_id, product_id, product_name, sku, quantity, unit_price, total, customization_snapshot
  from _pending_items;

  select jsonb_agg(jsonb_build_object(
    'product_name', product_name, 'quantity', quantity,
    'unit_price', unit_price, 'total', total, 'customization_snapshot', customization_snapshot
  ))
  into v_items_out
  from _pending_items;

  return jsonb_build_object(
    'order_id', v_order_id, 'order_number', v_order_number,
    'status', 'confirmed', 'payment_status', 'pending',
    'subtotal', v_subtotal, 'shipping_charge', v_delivery_fee, 'total_amount', v_total,
    'items', v_items_out, 'already_existed', false
  );
end;
$$;
