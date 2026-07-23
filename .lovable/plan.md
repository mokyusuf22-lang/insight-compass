
# Migrate off Lovable Cloud to your own Supabase project

This is a **permanent, one-way** move. Once Lovable Cloud is disconnected from this project, it cannot be re-enabled, and the current Cloud database is deleted. All data, auth users, edge functions, and secrets must be recreated in your new Supabase project.

## What you'll do (manual steps only you can perform)

1. Create a new Supabase project at supabase.com (choose region, set DB password — **save it**).
2. From the new project, collect:
   - Project URL
   - `anon` (publishable) key
   - `service_role` key
   - Postgres connection string
3. In Supabase Dashboard → Authentication → Providers, enable Email and configure Google OAuth (client ID + secret from Google Cloud Console; add the new project's callback URL as an authorized redirect URI).
4. In Supabase Dashboard → Authentication → URL Configuration, add your site URL and redirect URLs (`/auth?verified=true`, `/aura/welcome`, `/auth?reset=true`).

## What I'll do (in build mode, in order)

### Step 1 — Export current data
- Export every `public` table to CSV via psql `COPY` into `/mnt/documents/` (profiles, user_roles, all assessments, aura_sessions, coach_* tables, personal_paths, path_*, career_strategies, weekly_execution_plans, reality_reports).
- Export `auth.users` id + email + created_at so you can recreate accounts (passwords cannot be exported — users will need to reset).

### Step 2 — Generate schema SQL for new project
A single SQL file you'll run in the new Supabase SQL editor containing:
- `app_role` enum (`admin`, `coach`, `user`)
- All 22 public tables with columns, defaults, FKs
- GRANTs on every table
- RLS enable + all current policies
- All 10 database functions (`has_role`, `is_admin`, `get_my_roles`, `handle_new_user`, `update_updated_at_column`, `grant_coach_role`, `upsert_coach_profile`, `assign_demo_to_all_coaches`, `bootstrap_admin`, `is_assignment_participant`)
- `on_auth_user_created` trigger for `handle_new_user`
- `update_updated_at` triggers on tables with `updated_at`
- Realtime publication for `coach_messages`

### Step 3 — Data import instructions
Numbered import order respecting FKs (profiles → user_roles → assessments → everything else), using Supabase Dashboard CSV import or `\copy`.

### Step 4 — Redeploy edge functions
Push all 15 edge functions to your new project via Supabase CLI (I'll give you the exact commands). Re-add secrets in the new project: `STRIPE_SECRET_KEY`, `LOVABLE_API_KEY` (still works for AI Gateway even off Cloud).

### Step 5 — Point the app at your new project
Update `.env`:
```
VITE_SUPABASE_URL=<your new URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<your new anon key>
VITE_SUPABASE_PROJECT_ID=<your new ref>
```
Update `supabase/config.toml` project_id.

### Step 6 — Post-migration
- Re-run `bootstrap_admin()` or insert the admin row for `mokyusuf22@gmail.com` (new user_id after re-signup).
- Users log in via "Forgot password" to set new credentials.
- Verify Google OAuth redirect on the published URL.

### Step 7 — Disconnect Lovable Cloud (you do this)
Cloud tab → Advanced → Disconnect. **Irreversible.** Only do this after Step 6 is verified working.

## Risks

- **Passwords are lost.** Supabase does not export password hashes; all users must reset.
- **Downtime** between disconnect and DNS/env cutover.
- **Stripe customers** stay linked by email — no action needed.
- **Lovable Cloud-managed OAuth** stops working; you must configure Google OAuth yourself in Supabase.

Confirm to proceed and I'll start with Step 1 (data export) and Step 2 (schema SQL generation) in build mode.
