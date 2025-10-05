alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;

create policy if not exists "Users select" on public.users for select to authenticated using (auth.role() = 'authenticated');
create policy if not exists "Users insert" on public.users for insert to authenticated with check (auth.uid() = id);
create policy if not exists "Users update" on public.users for update to authenticated using (auth.uid() = id);

create policy if not exists "Channels select" on public.channels for select to authenticated using (auth.role() = 'authenticated');
create policy if not exists "Channels insert" on public.channels for insert to authenticated with check (auth.uid() = created_by and public.can_create_channel(auth.uid()));
create policy if not exists "Channels delete by owner" on public.channels for delete to authenticated using (auth.uid() = created_by) with check (true);
create policy if not exists "Channels delete by permission" on public.channels for delete to authenticated using (public.authorize('channels.delete'));

create policy if not exists "Messages select" on public.messages for select to authenticated using (auth.role() = 'authenticated');
create policy if not exists "Messages insert" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy if not exists "Messages update" on public.messages for update to authenticated using (auth.uid() = user_id);
create policy if not exists "Messages delete own" on public.messages for delete to authenticated using (auth.uid() = user_id);
create policy if not exists "Messages delete by permission" on public.messages for delete to authenticated using (public.authorize('messages.delete'));


