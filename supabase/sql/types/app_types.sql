-- Types
create type if not exists public.app_permission as enum ('channels.delete', 'messages.delete');
create type if not exists public.app_role as enum ('admin', 'moderator', 'user');
create type if not exists public.user_status as enum ('ONLINE', 'OFFLINE');


