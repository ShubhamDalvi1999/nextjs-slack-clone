## Role-based access control (RBAC) with Supabase Auth — Implementation Guide

1) Define your access model
   - List roles (e.g., admin, moderator, user) and required permissions (e.g., messages.delete, channels.delete).
   - Decide that Postgres (tables + RLS) is the single source of truth. Client gating is UX only.

2) Model roles in the database
   - Create types: `app_role`, `app_permission`.
   - Create tables: `user_roles` (user→role), optionally `role_permissions` (role→permission).
   - Ensure every auth user has a profile row (`public.users`).

3) Create a profile + default role on signup
   - Add a trigger on `auth.users` insert that:
     - Inserts into `public.users` with the auth user id.
     - Inserts a default role (e.g., `user`) into `public.user_roles`.
   - Optional: auto-assign elevated roles via plus-addressing patterns during onboarding.

4) Add a JWT access-token hook (custom claim)
   - Implement `public.custom_access_token_hook(event jsonb)` that looks up the user’s highest role and sets `user_role` in the JWT claims.
   - In Supabase Studio → Auth → Hooks, set “Customize Access Token (JWT) Claims hook” to the function above.
   - Note: Users must re-login (or refresh the session) to receive an updated token.

5) Authorize with RLS policies (server-side)
   - Enable RLS on protected tables.
   - Use `auth.uid()` for ownership checks.
   - For capability checks, create an `authorize(permission)` helper that maps `jwt.user_role` to permissions via `role_permissions`.
   - Write simple, deny-by-default policies (e.g., owner or `authorize('channels.delete')`).

6) (Optional) Administrative RPCs
   - Create SECURITY DEFINER functions for admin-only tasks (e.g., list users, assign/remove roles).
   - Inside the function, require `auth.jwt() ->> 'user_role' = 'admin'`.
   - Safety: prevent self-demotion, do not create unknown users, return clear errors.
   - Grant EXECUTE to `authenticated`; the function enforces authorization.

7) (Optional) Rate limits in RLS
   - Create helper functions (e.g., `can_create_channel(uid)`) that count rows in a time window.
   - Reference those helpers in INSERT policies to throttle writes (e.g., ≤5/hour per user).

8) Client integration (any frontend)
   - On session load/change, read `jwt.user_role` from the access token and store it in app state.
   - Gate UI (links, buttons) using the stored role. Do not trust UI alone—RLS is the real enforcement.
   - After role changes, prompt affected users to sign out/in to refresh JWT claims.

9) Foldering and migrations
   - Keep SQL in version control (recommended structure):
     - `supabase/sql/types/*` (enums)
     - `supabase/sql/schema/*` (tables)
     - `supabase/sql/functions/*` (RPCs, helpers, hooks)
     - `supabase/sql/policies/*` (RLS)
   - Use the Supabase CLI or your CI to apply these changes consistently.

10) Verification checklist
   - New signup (email/password or Google) creates `public.users` row and assigns default role.
   - Fresh JWT contains `user_role` claim.
   - RLS allows/denies as expected for each role (read/write/delete).
   - Admin RPCs accept admins and reject non-admins/self-modification.
   - Rate limits block excess writes and surface clear 403 errors to the UI.

11) Operations & security notes
   - Never expose the `service_role` key to clients.
   - Log important admin actions (role grants/removals) for auditability.
   - Keep permissions data-driven (add new permissions without code changes).
   - Treat the database as the source of truth; UI is an assist, not an authority.


