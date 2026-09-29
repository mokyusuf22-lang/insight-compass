-- Aura onboarding revamp: goal → about you → themes → check-ins → report → path → commit.
-- The whole in-progress flow (goal, answers, chosen path) is stored as one JSON blob so a
-- user can resume on another device. current_step now runs 0–7 during the flow and is set
-- to 8 once the user commits to a path.
ALTER TABLE public.aura_sessions
  ADD COLUMN IF NOT EXISTS flow_data jsonb;
