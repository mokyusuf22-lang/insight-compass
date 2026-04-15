
CREATE OR REPLACE FUNCTION public.upsert_coach_profile(
  target_user_id uuid,
  p_display_name text,
  p_bio text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.coach_profiles (user_id, display_name, bio)
  VALUES (target_user_id, p_display_name, p_bio)
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        updated_at = NOW();

  RETURN true;
END;
$$;

NOTIFY pgrst, 'reload schema';
