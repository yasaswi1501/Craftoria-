create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'total_orders', (select count(*) from public.orders),
    'orders_today', (select count(*) from public.orders where created_at >= current_date),
    'pending_orders', (select count(*) from public.orders where status in ('pending_payment', 'confirmed', 'processing')),
    'total_revenue', (select coalesce(sum(total_amount), 0) from public.orders where payment_status in ('paid', 'partially_refunded')),
    'revenue_today', (select coalesce(sum(total_amount), 0) from public.orders where payment_status = 'paid' and created_at >= current_date),
    'pending_returns', (select count(*) from public.returns where status = 'requested'),
    'pending_refunds', (select count(*) from public.refunds where status in ('requires_review', 'initiated', 'processing')),
    'low_stock_count', (select count(*) from public.inventory where available_quantity <= low_stock_threshold)
  );
end;
$$;

-- Feeds the "low-stock admin alerts" surface from the notification
-- architecture spec -- a simple polled read rather than a standing
-- notification row per product, so it always reflects live stock instead
-- of going stale.
create or replace function public.admin_low_stock_products()
returns table (
  variant_id uuid,
  sku text,
  product_name text,
  available_quantity int,
  low_stock_threshold int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  return query
  select pv.id, pv.sku, p.name, inv.available_quantity, inv.low_stock_threshold
  from public.inventory inv
  join public.product_variants pv on pv.id = inv.product_variant_id
  join public.products p on p.id = pv.product_id
  where inv.available_quantity <= inv.low_stock_threshold
  order by inv.available_quantity asc;
end;
$$;
