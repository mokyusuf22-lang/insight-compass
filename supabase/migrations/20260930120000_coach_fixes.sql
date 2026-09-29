-- Coaching fixes: coach access to client data, auto-matching, admin tools, messaging.
--
-- coach_messages keeps its live layout (assignment_id, sender_id, content, is_read).
-- A thread is one coach_assignments row; RLS already goes through
-- is_assignment_participant(). The frontend is updated to use assignment_id.
--
-- Every statement is idempotent so this can be re-run safely.

-- ── 1. user_roles: remove the self-referencing admin policy (caused 500s) ──
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ── 2. coach_assignments ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_assignments_status_check'
  ) THEN
    ALTER TABLE public.coach_assignments
      ADD CONSTRAINT coach_assignments_status_check CHECK (status IN ('active', 'paused', 'ended'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.coach_assignments'::regclass AND contype = 'u'
  ) THEN
    ALTER TABLE public.coach_assignments
      ADD CONSTRAINT coach_assignments_coach_id_user_id_key UNIQUE (coach_id, user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Admins manage all assignments" ON public.coach_assignments;
CREATE POLICY "Admins manage all assignments" ON public.coach_assignments
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ── 3. coach_messages: read receipts, index + realtime ──────
-- Only the recipient may mark a message read (previously any participant could update any message).
DROP POLICY IF EXISTS "Participants can update messages" ON public.coach_messages;
DROP POLICY IF EXISTS "Recipients can mark messages read" ON public.coach_messages;
CREATE POLICY "Recipients can mark messages read" ON public.coach_messages
  FOR UPDATE USING (public.is_assignment_participant(_assignment_id => assignment_id, _user_id => auth.uid()) AND sender_id <> auth.uid());

CREATE INDEX IF NOT EXISTS coach_messages_assignment_created_idx
  ON public.coach_messages (assignment_id, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coach_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_messages;
  END IF;
END $$;

-- ── 4. Coach access to assigned clients' data ──────────────
CREATE OR REPLACE FUNCTION public.is_coach_of(_client uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = auth.uid() AND user_id = _client AND status = 'active'
  )
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'aura_sessions', 'path_commitments', 'reality_reports', 'path_recommendations',
    'disc_assessments', 'value_map_assessments', 'wheel_of_life_assessments',
    'blob_tree_assessments', 'strengths_assessments', 'mbti_assessments'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "Coaches view assigned clients" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "Coaches view assigned clients" ON public.%I FOR SELECT USING (public.is_coach_of(user_id))', t);
      EXECUTE format('DROP POLICY IF EXISTS "Admins view all rows" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "Admins view all rows" ON public.%I FOR SELECT USING (public.is_admin(auth.uid()))', t);
    END IF;
  END LOOP;
END $$;

-- Coaches can read and edit (but not create duplicate) paths of assigned clients.
DROP POLICY IF EXISTS "Coaches can manage assigned mentee paths" ON public.personal_paths;
DROP POLICY IF EXISTS "Coaches view assigned paths" ON public.personal_paths;
CREATE POLICY "Coaches can manage assigned mentee paths" ON public.personal_paths
  FOR ALL USING (public.is_coach_of(user_id)) WITH CHECK (public.is_coach_of(user_id));

-- ── 5. Coach capacity + matching queue ─────────────────────
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS max_clients integer NOT NULL DEFAULT 15;

CREATE TABLE IF NOT EXISTS public.coach_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'cancelled')),
  goal        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  assigned_at timestamptz
);
ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own coach request" ON public.coach_requests;
CREATE POLICY "Users view own coach request" ON public.coach_requests
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage coach requests" ON public.coach_requests;
CREATE POLICY "Admins manage coach requests" ON public.coach_requests
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Active, non-demo client count per approved coach.
CREATE OR REPLACE FUNCTION public.coach_loads()
RETURNS TABLE(coach_id uuid, display_name text, max_clients integer, active_clients integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.user_id, cp.display_name, cp.max_clients,
         (SELECT count(*)::int FROM public.coach_assignments ca
           WHERE ca.coach_id = cp.user_id AND ca.status = 'active' AND NOT ca.is_demo)
  FROM public.coach_profiles cp
  WHERE public.has_role(_user_id => cp.user_id, _role => 'coach')
$$;
REVOKE EXECUTE ON FUNCTION public.coach_loads() FROM anon, authenticated;

-- Called by a user who chose "with a human coach". Assigns the least-loaded coach
-- with room, or queues the user for an admin. Returns the assignment or NULL.
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

  SELECT l.coach_id, l.display_name INTO v_coach
  FROM public.coach_loads() l
  WHERE l.coach_id <> v_uid AND l.active_clients < l.max_clients
  ORDER BY l.active_clients ASC, random()
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

-- ── 6. Admin tools ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_assign_coach(p_user uuid, p_coach uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF NOT public.has_role(_user_id => p_coach, _role => 'coach') THEN RAISE EXCEPTION 'That user is not a coach'; END IF;

  -- One real coach at a time: end any other active non-demo assignment.
  UPDATE public.coach_assignments SET status = 'ended'
  WHERE user_id = p_user AND coach_id <> p_coach AND status = 'active' AND NOT is_demo;

  INSERT INTO public.coach_assignments (coach_id, user_id, status, is_demo)
  VALUES (p_coach, p_user, 'active', false)
  ON CONFLICT (coach_id, user_id) DO UPDATE SET status = 'active', is_demo = false, updated_at = now()
  RETURNING id INTO v_id;

  UPDATE public.coach_requests SET status = 'assigned', assigned_at = now() WHERE user_id = p_user;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_end_assignment(p_assignment uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.coach_assignments SET status = 'ended' WHERE id = p_assignment;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_max_clients(p_coach uuid, p_max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF p_max < 0 OR p_max > 500 THEN RAISE EXCEPTION 'max_clients must be between 0 and 500'; END IF;
  UPDATE public.coach_profiles SET max_clients = p_max, updated_at = now() WHERE user_id = p_coach;
  RETURN FOUND;
END;
$$;

-- Everything the admin coaching screen needs in one call.
CREATE OR REPLACE FUNCTION public.admin_coaching_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN jsonb_build_object(
    'coaches', COALESCE((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.display_name) FROM public.coach_loads() l), '[]'::jsonb),
    'requests', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', r.user_id, 'goal', r.goal, 'created_at', r.created_at,
        'email', p.email,
        'name', (SELECT s.name FROM public.aura_sessions s WHERE s.user_id = r.user_id ORDER BY s.created_at DESC LIMIT 1)
      ) ORDER BY r.created_at)
      FROM public.coach_requests r
      LEFT JOIN public.profiles p ON p.user_id = r.user_id
      WHERE r.status = 'open'), '[]'::jsonb),
    'assignments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ca.id, 'coach_id', ca.coach_id, 'user_id', ca.user_id, 'created_at', ca.created_at,
        'coach_name', cp.display_name, 'email', p.email,
        'name', (SELECT s.name FROM public.aura_sessions s WHERE s.user_id = ca.user_id ORDER BY s.created_at DESC LIMIT 1),
        'goal', (SELECT s.challenge_text FROM public.aura_sessions s WHERE s.user_id = ca.user_id ORDER BY s.created_at DESC LIMIT 1)
      ) ORDER BY ca.created_at DESC)
      FROM public.coach_assignments ca
      LEFT JOIN public.coach_profiles cp ON cp.user_id = ca.coach_id
      LEFT JOIN public.profiles p ON p.user_id = ca.user_id
      WHERE ca.status = 'active' AND NOT ca.is_demo), '[]'::jsonb)
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
