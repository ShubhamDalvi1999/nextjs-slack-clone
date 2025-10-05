-- Tables
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


