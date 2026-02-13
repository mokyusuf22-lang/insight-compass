
-- Add missing progress flags to profiles for the CLARITY flow
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS challenges_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wheel_of_life_complete boolean NOT NULL DEFAULT false;
