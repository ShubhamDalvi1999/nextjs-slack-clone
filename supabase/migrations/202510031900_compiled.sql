-- Consolidated schema/functions as of current environment
-- Types
create type if not exists public.app_permission as enum ('channels.delete', 'messages.delete');
create type if not exists public.app_role as enum ('admin', 'moderator', 'user');
create type if not exists public.user_status as enum ('ONLINE', 'OFFLINE');

-- Tables (idempotent creates simplified; adjust if using full diff tooling)
create table if not exists public.users (
  id uuid primary key references auth.users not null,
  username text,
  status public.user_status default 'OFFLINE'
);

create table if not exists public.channels (
  id bigserial primary key,
  inserted_at timestamptz default timezone('utc'::text, now()) not null,
  slug text unique not null,
  created_by uuid not null references public.users
);

create table if not exists public.messages (
  id bigserial primary key,
  inserted_at timestamptz default timezone('utc'::text, now()) not null,
  message text,
  user_id uuid not null references public.users,
  channel_id bigint not null references public.channels on delete cascade
);

create table if not exists public.user_roles (
  id bigserial primary key,
  user_id uuid not null references public.users on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table if not exists public.role_permissions (
  id bigserial primary key,
  role public.app_role not null,
  permission public.app_permission not null,
  unique (role, permission)
);

-- Functions
create or replace function public.authorize(requested_permission public.app_permission)
returns boolean
language plpgsql security definer set search_path = public as $$
declare bind_permissions int; begin
  select count(*) into bind_permissions
  from public.role_permissions
  where permission = authorize.requested_permission
    and role = (auth.jwt() ->> 'user_role')::public.app_role;
  return bind_permissions > 0;
end; $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = auth, public as $$
declare is_admin boolean; begin
  insert into public.users (id, username) values (new.id, new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  select count(*) = 1 from auth.users into is_admin;
  if position('+supaadmin@' in new.email) > 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  elsif position('+supamod@' in new.email) > 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'moderator');
  end if;
  return new; end; $$;

-- Access token hook (to be set in Studio -> Auth -> Hooks)
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
  declare claims jsonb; user_role public.app_role; begin
    select role into user_role from public.user_roles
    where user_id = (event->>'user_id')::uuid
    order by case role when 'admin' then 1 when 'moderator' then 2 when 'user' then 3 else 99 end limit 1;
    claims := event->'claims';
    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end; $$;

-- Admin RPCs
create or replace function public.get_users_roles()
returns table (user_id uuid, email text, username text, roles public.app_role[])
language plpgsql stable security definer set search_path = public, auth as $$ begin
  if (auth.jwt() ->> 'user_role') is distinct from 'admin' then raise exception 'forbidden: admin only'; end if;
  return query
  select u.id, (au.email)::text, u.username,
         coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}'::public.app_role[])
  from public.users u
  join auth.users au on au.id = u.id
  left join public.user_roles ur on ur.user_id = u.id
  group by u.id, au.email, u.username
  order by au.email; end; $$;

grant execute on function public.get_users_roles() to authenticated;

create or replace function public.set_user_role(target_email text, target_role public.app_role, grant_role boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare target_id uuid; caller_id uuid; caller_role text; begin
  caller_role := (auth.jwt() ->> 'user_role');
  caller_id := auth.uid();
  if caller_role is distinct from 'admin' then raise exception 'forbidden: admin only'; end if;
  select id into target_id from auth.users where email = target_email;
  if target_id is null then raise exception 'user_not_found'; end if;
  if target_id = caller_id then raise exception 'cannot_modify_self'; end if;
  if grant_role then
    insert into public.user_roles (user_id, role) values (target_id, target_role) on conflict do nothing;
  else
    delete from public.user_roles where user_id = target_id and role = target_role;
  end if; end; $$;

grant execute on function public.set_user_role(text, public.app_role, boolean) to authenticated;

-- Rate limit for channels
create or replace function public.can_create_channel(uid uuid)
returns boolean language sql stable as $$
  select count(*) < 5 from public.channels where created_by = uid and inserted_at >= now() - interval '1 hour'
$$;

-- Policies (recreate essentials)
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;

create policy if not exists "Allow logged-in read access" on public.users for select to authenticated using (auth.role() = 'authenticated');
create policy if not exists "Allow individual insert access" on public.users for insert to authenticated with check (auth.uid() = id);
create policy if not exists "Allow individual update access" on public.users for update to authenticated using (auth.uid() = id);

create policy if not exists "Allow logged-in read access (channels)" on public.channels for select to authenticated using (auth.role() = 'authenticated');
create policy if not exists "Allow individual insert access (channels)" on public.channels for insert to authenticated with check (auth.uid() = created_by and public.can_create_channel(auth.uid()));
create policy if not exists "Allow individual delete access (channels)" on public.channels for delete to authenticated using (auth.uid() = created_by) with check (true);
create policy if not exists "Allow authorized delete access (channels)" on public.channels for delete to authenticated using (public.authorize('channels.delete'));

create policy if not exists "Allow logged-in read access (messages)" on public.messages for select to authenticated using (auth.role() = 'authenticated');
create policy if not exists "Allow individual insert access (messages)" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy if not exists "Allow individual update access (messages)" on public.messages for update to authenticated using (auth.uid() = user_id);
create policy if not exists "Allow individual delete access (messages)" on public.messages for delete to authenticated using (auth.uid() = user_id);
create policy if not exists "Allow authorized delete access (messages)" on public.messages for delete to authenticated using (public.authorize('messages.delete'));
