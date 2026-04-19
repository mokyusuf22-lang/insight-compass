-- Add is_demo flag to coach_assignments so demo rows can be identified in the UI
ALTER TABLE public.coach_assignments
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Function: assign a demo/sample client to every coach that doesn't already have one.
-- Called by admin from the dashboard UI.
-- Returns the number of new assignments created.
CREATE OR REPLACE FUNCTION public.assign_demo_to_all_coaches(
  p_demo_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Only admins may call this
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Insert demo assignment for every coach that doesn't already have this demo user
  INSERT INTO public.coach_assignments (coach_id, user_id, status, is_demo)
  SELECT cp.user_id, p_demo_user_id, 'active', true
  FROM public.coach_profiles cp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = cp.user_id
      AND ca.user_id = p_demo_user_id
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

NOTIFY pgrst, 'reload schema';
