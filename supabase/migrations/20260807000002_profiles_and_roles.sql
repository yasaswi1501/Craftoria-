-- profiles: 1:1 extension of auth.users, plus the role model authorization is built on.

create type public.user_role as enum ('customer', 'admin', 'super_admin', 'support', 'inventory_manager');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role-check helpers used by RLS policies on every later table.
-- SECURITY DEFINER + fixed search_path so these bypass RLS on `profiles` internally
-- (a policy on profiles that queries profiles directly would recurse otherwise)
-- and can't be hijacked via a malicious search_path.
create or replace function public.current_role_name()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role_name() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role_name() in ('admin', 'super_admin', 'support', 'inventory_manager'), false);
$$;

-- Auto-create a profile row the moment a new auth.users row appears
-- (email/password signup, Google OAuth, doesn't matter which).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- profiles.email is NOT NULL, but auth.users.email is nullable (phone/OTP
  -- or some OAuth configurations can leave it null) -- coalesce to '' so a
  -- future non-email signup method can't fail this insert and, with it, the
  -- entire auth.users row creation (this trigger runs inside that same
  -- transaction). The app's current signup paths (email/password, Google
  -- OAuth) always populate it, so this only matters if that ever changes.
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A user can never grant themselves (or anyone) a higher role by updating
-- their own row. Trusted server-side tooling (the service-role key -- an
-- admin dashboard backend, support tooling, bootstrapping the first admin)
-- is exempt: triggers run regardless of BYPASSRLS (that flag only affects
-- row-security policies, not triggers), so without this explicit check
-- there would be no way to ever promote a user's role at all, even from a
-- fully trusted server context.
--
-- Checked via the JWT role claim GUC (the same mechanism auth.uid() reads
-- for `sub`), not current_user/session_user: this function is SECURITY
-- DEFINER, so current_user is already overridden to the function's owner
-- by the time this body runs, and session_user reflects PostgREST's fixed
-- connection-pool role rather than the per-request JWT role either way.
-- GUC settings survive the SECURITY DEFINER context switch, which is
-- exactly why they're the right thing to check here.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- No insert/delete policy for regular clients: rows are created only by the
-- handle_new_user trigger (SECURITY DEFINER, bypasses RLS) and deleted via
-- the auth.users cascade. Admin tooling can still act via the service role.
