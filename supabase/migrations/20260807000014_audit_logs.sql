-- Append-only. No update/delete policy for anyone -- an audit trail that can
-- be edited or erased by the same admins it's supposed to be watching isn't one.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_staff" on public.audit_logs
  for select using (public.is_staff());

create policy "audit_logs_insert_staff" on public.audit_logs
  for insert with check (public.is_staff());

-- Convenience wrapper for the admin RPCs written in Phase 8. SECURITY
-- DEFINER so it works the same way whether called by an admin session or
-- internally by another SECURITY DEFINER function.
create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_value jsonb default null,
  p_new_value jsonb default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_value, p_new_value, p_metadata);
end;
$$;

-- Internal-only: called from other SECURITY DEFINER admin RPCs (Phase 8),
-- which don't need their own EXECUTE grant to invoke it -- they run as the
-- function owner. Never exposed as a directly callable RPC, or any logged-in
-- customer could insert fabricated entries into the audit trail.
-- (Revoking from anon/authenticated explicitly, not just `public`, because
-- Supabase's default privileges grant EXECUTE on new functions directly to
-- those roles regardless of the PUBLIC pseudo-role.)
revoke execute on function public.write_audit_log(text, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
