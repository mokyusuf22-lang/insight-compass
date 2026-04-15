
DO $$
DECLARE pol TEXT;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'coach_applications' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.coach_applications', pol);
  END LOOP;
END $$;

CREATE POLICY "Users can insert own application"
  ON public.coach_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own application"
  ON public.coach_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON public.coach_applications FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update applications"
  ON public.coach_applications FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
