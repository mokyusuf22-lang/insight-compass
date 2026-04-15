
-- Add missing columns
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Drop all existing policies and recreate cleanly
DO $$
DECLARE pol TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'coach_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.coach_profiles', pol);
  END LOOP;
END $$;

-- Coaches can manage their own profile
CREATE POLICY "Coaches manage own profile"
  ON public.coach_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all coach profiles
CREATE POLICY "Admins can view all coach profiles"
  ON public.coach_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Anyone can view coach profiles (for matching)
CREATE POLICY "Anyone can view coach profiles"
  ON public.coach_profiles FOR SELECT
  USING (true);

NOTIFY pgrst, 'reload schema';
