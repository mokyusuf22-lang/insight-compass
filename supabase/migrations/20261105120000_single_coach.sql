-- One coach for everyone.
--
-- Every user who asks for a coach is assigned the coach marked is_primary.
-- If no coach is marked, any approved coach is used. Capacity limits are ignored.
-- If no coach account exists at all, the user is queued in coach_requests (as before).
--
-- AFTER RUNNING: mark your coach (find their user_id in Authentication → Users):
--   UPDATE public.coach_profiles SET is_primary = true WHERE user_id = '<coach-user-id>';
--
-- Idempotent; safe to re-run.

ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- At most one primary coach.
CREATE UNIQUE INDEX IF NOT EXISTS coach_profiles_one_primary
  ON public.coach_profiles (is_primary) WHERE is_primary;

CREATE OR REPLACE FUNCTION public.request_coach(p_goal text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing record;
  v_coach record;
  v_assignment_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT ca.id, ca.coach_id, cp.display_name INTO v_existing
  FROM public.coach_assignments ca
  LEFT JOIN public.coach_profiles cp ON cp.user_id = ca.coach_id
  WHERE ca.user_id = v_uid AND ca.status = 'active' AND NOT ca.is_demo
  ORDER BY ca.created_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('assignment_id', v_existing.id, 'coach_id', v_existing.coach_id, 'display_name', v_existing.display_name);
  END IF;

  -- The primary coach first, then any approved coach (oldest profile first, so it's stable).
  SELECT cp.user_id AS coach_id, cp.display_name INTO v_coach
  FROM public.coach_profiles cp
  WHERE public.has_role(_user_id => cp.user_id, _role => 'coach') AND cp.user_id <> v_uid
  ORDER BY cp.is_primary DESC, cp.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.coach_requests (user_id, goal, status)
    VALUES (v_uid, left(p_goal, 200), 'open')
    ON CONFLICT (user_id) DO UPDATE SET status = 'open', goal = EXCLUDED.goal, created_at = now(), assigned_at = NULL;
    RETURN NULL;
  END IF;

  INSERT INTO public.coach_assignments (coach_id, user_id, status, is_demo)
  VALUES (v_coach.coach_id, v_uid, 'active', false)
  ON CONFLICT (coach_id, user_id) DO UPDATE SET status = 'active', updated_at = now()
  RETURNING id INTO v_assignment_id;

  INSERT INTO public.coach_requests (user_id, goal, status, assigned_at)
  VALUES (v_uid, left(p_goal, 200), 'assigned', now())
  ON CONFLICT (user_id) DO UPDATE SET status = 'assigned', assigned_at = now();

  RETURN jsonb_build_object('assignment_id', v_assignment_id, 'coach_id', v_coach.coach_id, 'display_name', v_coach.display_name);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.request_coach(text) FROM anon;

NOTIFY pgrst, 'reload schema';
