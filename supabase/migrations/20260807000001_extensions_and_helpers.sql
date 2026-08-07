-- Extensions & generic helpers used across every later migration.

create extension if not exists pgcrypto;

-- Generic updated_at maintenance, attached per-table via trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
