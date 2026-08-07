-- Generic audit trigger for tables admins write to directly via RLS
-- (products, variants, categories, coupons -- see the *_admin_write
-- policies from Phase 2). UPDATE/DELETE only, not INSERT: routine catalog
-- setup (seeding, adding new SKUs) would otherwise spam the log, whereas
-- "a price silently changed" or "a coupon got deleted" is exactly the kind
-- of thing this table exists to catch. Orders/returns/refunds already get
-- audited by their own dedicated RPCs (Phase 7), which capture more
-- specific context than a generic row diff would.
create or replace function public.audit_table_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- old is always available here (this trigger only ever fires for UPDATE
  -- or DELETE, never INSERT); new is null on DELETE.
  perform public.write_audit_log(
    tg_table_name || '_' || lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id)::text,
    to_jsonb(old),
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    null
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger products_audit_write
  after update or delete on public.products
  for each row execute function public.audit_table_write();

create trigger product_variants_audit_write
  after update or delete on public.product_variants
  for each row execute function public.audit_table_write();

create trigger categories_audit_write
  after update or delete on public.categories
  for each row execute function public.audit_table_write();

create trigger coupons_audit_write
  after update or delete on public.coupons
  for each row execute function public.audit_table_write();

-- Role changes get their own trigger rather than relying on the generic one
-- above (profiles isn't in that list -- most profile edits are just a user
-- updating their own name/phone, which isn't audit-worthy). Only the role
-- column matters here.
create or replace function public.audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    perform public.write_audit_log(
      'profile_role_change',
      'profile',
      new.id::text,
      jsonb_build_object('role', old.role),
      jsonb_build_object('role', new.role),
      null
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_role_change
  after update on public.profiles
  for each row execute function public.audit_role_change();
