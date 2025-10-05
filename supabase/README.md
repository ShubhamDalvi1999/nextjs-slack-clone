# Database docs

This project uses Supabase (Postgres + Auth + PostgREST + Realtime). RBAC is enforced in Postgres with RLS.

## Tables
- `public.users (id uuid pk -> auth.users.id, username text, status user_status)`
- `public.channels (id bigserial pk, inserted_at timestamptz, slug text unique, created_by uuid -> public.users.id)`
- `public.messages (id bigserial pk, inserted_at timestamptz, message text, user_id uuid -> public.users.id, channel_id bigint -> public.channels.id)`
- `public.user_roles (id bigserial pk, user_id uuid -> public.users.id, role app_role)`
- `public.role_permissions (id bigserial pk, role app_role, permission app_permission)`

## Types
- `public.app_role`: `admin | moderator | user`
- `public.app_permission`: `channels.delete | messages.delete`
- `public.user_status`: `ONLINE | OFFLINE`

## Key functions
- `public.custom_access_token_hook(event jsonb) returns jsonb` — injects `user_role` claim into JWT (highest role of user)
- `public.get_users_roles() returns table(user_id uuid, email text, username text, roles app_role[])` — list users and roles (admin only)
- `public.set_user_role(target_email text, target_role app_role, grant_role boolean)` — grant/revoke roles (admin only, cannot modify self, existing users only)
- `public.can_create_channel(uid uuid) returns boolean` — rate-limit channel creation (≤5/hour)

## Policies (high level)
- `public.users` select/update/insert restricted to the owner
- `public.channels` select for authenticated; insert requires `auth.uid() = created_by` AND `can_create_channel(auth.uid())`; delete allowed to creator or `authorize('channels.delete')`
- `public.messages` select for authenticated; insert/update/delete restricted to author or `authorize('messages.delete')`
- `public.user_roles` select per-user; admin read via `supabase_auth_admin`

## Notes
- Admin UI calls RPCs; only admins (via JWT claim `user_role`) can manage roles.
- Users must re-login to refresh JWT after role changes or hook updates.
