# Next.js Realtime Chat (Supabase RBAC Edition)

A Slack-like chat built with Next.js and Supabase. This fork adds production-grade role-based access control (RBAC), an admin dashboard, and server-enforced rate limits.

## Stack
- Frontend: Next.js, Tailwind CSS
- Auth & Backend: Supabase (Auth/GoTrue, PostgREST, Realtime, Postgres RLS)

## Features
- Email/password auth (works with Google OAuth as well)
- Realtime channels and messages
- RBAC with custom JWT claim `user_role` (admin, moderator, user)
- Admin dashboard to manage roles (existing users only, self-modification blocked)
- Server-side rate limit: at most 5 channel creations per user per hour

## Getting Started
1. Create a Supabase project and copy API credentials
   - Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from Project Settings → API.

2. Configure environment
   - Copy `.env.example` → `.env.local` and set the values above.

3. Apply database schema & functions
   - Review versioned SQL under `supabase/sql/` (types, tables, functions, policies).
   - Apply via Supabase Studio SQL editor or CLI (recommended for teams).

4. Set the Access Token (JWT) claims hook
   - In Supabase Studio → Auth → Hooks, set the “Customize Access Token (JWT) Claims hook” to `public.custom_access_token_hook`.
   - Users must re-login after role changes to refresh JWT claims.

5. Run the app
   - `npm install`
   - `npm run dev`
   - Open http://localhost:3000

## Admin Dashboard
- Navigate to `/admin/users` (visible only when `user_role=admin`).
- Search existing users and toggle roles (admin/moderator). Self role changes are disabled.
- Changes persist immediately; affected users must re-login to receive updated JWT claims.

## RBAC Overview
- Roles and permissions live in Postgres: `user_roles`, `role_permissions`.
- `public.custom_access_token_hook` writes `user_role` into the JWT for each login.
- RLS policies enforce permissions server-side using `auth.uid()` and `authorize(permission)`.
- UI gates (badges, admin link) use the JWT claim for UX; server remains the source of truth.

## Rate Limits
- Channel creation is throttled by a Postgres helper `can_create_channel(auth.uid())` used in the INSERT policy.
- Exceeding the limit returns 403; the UI shows a friendly error.

## Project Structure (DB)
- `supabase/sql/types/` – enums (`app_role`, `app_permission`)
- `supabase/sql/schema/` – tables (users, channels, messages, user_roles, role_permissions)
- `supabase/sql/functions/` – RPCs and helpers (authorize, access token hook, role RPCs, rate-limit helpers)
- `supabase/sql/policies/` – RLS policies
- See `docs/rbac-setup.md` for a numbered implementation guide.

## Troubleshooting
- Role badge shows “unavailable”
  - Ensure the Access Token hook is set and the user has a row in `public.user_roles`.
  - Sign out/in to issue a fresh JWT containing `user_role`.
- Admin page shows “Forbidden”
  - Your JWT must include `user_role=admin`. Re-login after you are granted admin.

## Credits
- Based on the Supabase Next.js Slack clone. Enhanced with structured RBAC, admin tooling, and rate limits.
