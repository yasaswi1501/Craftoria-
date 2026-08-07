-- Postgres does not auto-index foreign key columns the way it does primary
-- keys. Found via a systematic sweep of every FK in the schema against
-- pg_index, not by intuition -- these are the 7 that were missing a
-- covering index, which matters for join performance and for how
-- efficiently ON DELETE CASCADE/SET NULL can find dependent rows.
create index order_items_variant_idx on public.order_items(variant_id);
create index order_status_history_changed_by_idx on public.order_status_history(changed_by);
create index coupon_usage_order_idx on public.coupon_usage(order_id);
create index payment_events_payment_idx on public.payment_events(payment_id);
create index reviews_order_idx on public.reviews(order_id);
create index refunds_payment_idx on public.refunds(payment_id);
create index refunds_return_idx on public.refunds(return_id);
