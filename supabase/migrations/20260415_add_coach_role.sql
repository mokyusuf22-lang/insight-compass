-- ─── Add 'coach' to app_role enum ────────────────────────────────────────────
-- The original enum only contained ('admin', 'user').
-- The coach feature inserts and filters on 'coach', which caused 500 errors
-- because PostgreSQL rejects unknown enum values at query time.
--
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so this
-- migration must be run outside of BEGIN/COMMIT (Supabase runs it directly).

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coach';
