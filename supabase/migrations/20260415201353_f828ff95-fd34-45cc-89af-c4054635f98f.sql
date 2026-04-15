
CREATE OR REPLACE FUNCTION public.grant_coach_role(target_user_id uuid)
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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'coach')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

NOTIFY pgrst, 'reload schema';
