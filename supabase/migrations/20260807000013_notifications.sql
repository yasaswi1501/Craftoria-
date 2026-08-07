create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id);
create index notifications_user_unread_idx on public.notifications(user_id) where not read;

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

create policy "notifications_insert_staff" on public.notifications
  for insert with check (public.is_staff());

-- Most notification rows (order confirmed, payment received, shipped, ...)
-- are written by the service-role Edge Functions in later phases, which
-- bypass RLS entirely -- the staff insert policy above only covers
-- admin-triggered broadcasts done from an authenticated admin session.
