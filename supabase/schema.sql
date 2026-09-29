-- ============================================================
-- Insight Compass – Full Schema Migration
-- Generated from src/integrations/supabase/types.ts
-- Run this in your new Supabase project's SQL Editor
-- ============================================================

-- ── Enum ─────────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'coach');

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email                    text,
  has_paid                 boolean NOT NULL DEFAULT false,
  subscription_tier        text,
  subscription_end_date    timestamptz,
  last_payment_date        timestamptz,
  onboarding_complete      boolean NOT NULL DEFAULT false,
  step1_completed          boolean NOT NULL DEFAULT false,
  disc_completed           boolean NOT NULL DEFAULT false,
  mbti_completed           boolean NOT NULL DEFAULT false,
  strengths_completed      boolean NOT NULL DEFAULT false,
  blob_tree_complete       boolean NOT NULL DEFAULT false,
  value_map_complete       boolean NOT NULL DEFAULT false,
  wheel_of_life_complete   boolean NOT NULL DEFAULT false,
  challenges_complete      boolean NOT NULL DEFAULT false,
  reality_report_generated boolean NOT NULL DEFAULT false,
  path_options_shown       boolean NOT NULL DEFAULT false,
  path_committed           boolean NOT NULL DEFAULT false,
  personal_path_generated  boolean NOT NULL DEFAULT false,
  strategy_generated       boolean NOT NULL DEFAULT false,
  career_goals             jsonb,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.assessment_responses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id      text NOT NULL,
  answer           text NOT NULL,
  is_paid_question boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type text NOT NULL DEFAULT '',
  is_complete     boolean NOT NULL DEFAULT false,
  is_paid         boolean NOT NULL DEFAULT false,
  result_summary  jsonb,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.aura_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text,
  email             text,
  challenge_text    text,
  identified_themes jsonb,
  aura_summary      text,
  preferred_contact text,
  current_step      integer,  -- 0–7 during the Aura flow, 8 once committed
  user_confirmed    boolean,
  flow_data         jsonb,    -- in-progress Aura flow state (goal, check-ins, chosen path)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blob_tree_assessments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_blob integer,
  desired_blob integer,
  is_complete  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.career_strategies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disc_result           jsonb,
  mbti_result           jsonb,
  strengths_result      jsonb,
  career_goals          jsonb,
  strategy              jsonb,
  skill_development_plan jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_applications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio          text NOT NULL,
  experience   text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  uuid REFERENCES auth.users(id),
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE public.coach_assignments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  is_demo    boolean NOT NULL DEFAULT false,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, user_id)
);

CREATE TABLE public.coach_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.coach_assignments(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       text NOT NULL,
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One row per client who asked for a human coach (open = waiting in the admin queue).
CREATE TABLE public.coach_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'cancelled')),
  goal        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  assigned_at timestamptz
);

-- Goal catalogue: see migrations 20260930130000_goals_catalogue.sql (table, search_goals)
-- and 20260930130100_seed_goals.sql (1,200+ goals built from supabase/seed/goals/*.json).

CREATE TABLE public.coach_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  bio          text,
  avatar_url   text,
  specialties  jsonb,
  availability text,
  max_clients  integer NOT NULL DEFAULT 15,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.disc_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_question integer NOT NULL DEFAULT 0,
  responses        jsonb NOT NULL DEFAULT '{}',
  result           jsonb,
  is_complete      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mbti_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_question integer NOT NULL DEFAULT 0,
  responses        jsonb NOT NULL DEFAULT '{}',
  result           jsonb,
  is_complete      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.path_commitments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chosen_path jsonb NOT NULL,
  intent      text,
  focus_area  text,
  time_budget text,
  constraints text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.path_recommendations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendations     jsonb NOT NULL DEFAULT '{}',
  selected_path_index integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.personal_paths (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id       uuid REFERENCES auth.users(id),
  title          text NOT NULL,
  description    text,
  phases         jsonb NOT NULL DEFAULT '[]',
  total_progress integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reality_reports (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_summary  text,
  strengths          jsonb,
  risks              jsonb,
  key_constraints    jsonb,
  blob_tree_summary  jsonb,
  value_map_summary  jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.step1_assessments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_current_role text,
  user_target_role  text,
  biggest_challenge text,
  time_horizon      text,
  axis_scores       jsonb NOT NULL DEFAULT '{}',
  ai_hypothesis     jsonb,
  is_complete       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.strengths_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_question integer NOT NULL DEFAULT 0,
  responses        jsonb NOT NULL DEFAULT '{}',
  result           jsonb,
  is_complete      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.value_map_assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_values jsonb NOT NULL DEFAULT '{}',
  ranked_values   jsonb NOT NULL DEFAULT '{}',
  top_five        jsonb NOT NULL DEFAULT '{}',
  is_complete     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.weekly_execution_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id     uuid REFERENCES public.career_strategies(id),
  week_number     integer NOT NULL DEFAULT 1,
  week_start_date text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  tasks           jsonb NOT NULL DEFAULT '[]',
  completed_tasks jsonb NOT NULL DEFAULT '[]',
  current_phase   text,
  coaching_notes  text,
  is_complete     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wheel_of_life_assessments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores      jsonb NOT NULL DEFAULT '{}',
  notes       text,
  is_complete boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX ON public.profiles (user_id);
CREATE INDEX ON public.user_roles (user_id);
CREATE INDEX ON public.assessment_responses (user_id);
CREATE INDEX ON public.assessments (user_id);
CREATE INDEX ON public.aura_sessions (user_id);
CREATE INDEX ON public.blob_tree_assessments (user_id);
CREATE INDEX ON public.career_strategies (user_id);
CREATE INDEX ON public.coach_applications (user_id);
CREATE INDEX ON public.coach_assignments (user_id);
CREATE INDEX ON public.coach_assignments (coach_id);
CREATE INDEX ON public.coach_messages (assignment_id, created_at);
CREATE INDEX ON public.coach_profiles (user_id);
CREATE INDEX ON public.disc_assessments (user_id);
CREATE INDEX ON public.mbti_assessments (user_id);
CREATE INDEX ON public.path_commitments (user_id);
CREATE INDEX ON public.path_recommendations (user_id);
CREATE INDEX ON public.personal_paths (user_id);
CREATE INDEX ON public.reality_reports (user_id);
CREATE INDEX ON public.step1_assessments (user_id);
CREATE INDEX ON public.strengths_assessments (user_id);
CREATE INDEX ON public.value_map_assessments (user_id);
CREATE INDEX ON public.weekly_execution_plans (user_id);
CREATE INDEX ON public.wheel_of_life_assessments (user_id);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','aura_sessions','blob_tree_assessments','career_strategies',
    'coach_assignments','coach_profiles','disc_assessments','mbti_assessments',
    'path_commitments','path_recommendations','personal_paths','reality_reports',
    'step1_assessments','strengths_assessments','value_map_assessments',
    'weekly_execution_plans','wheel_of_life_assessments'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t
    );
  END LOOP;
END;
$$;

-- ── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Functions ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role('admin', _user_id);
$$;

CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE(role public.app_role) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_admin(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only works while no admin exists (first-run bootstrap).
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_coach_role(target_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can grant coach role';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'coach')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_assignment_participant(_assignment_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE id = _assignment_id
      AND (user_id = _user_id OR coach_id = _user_id)
  );
$$;

-- True when the caller is the active coach of _client (used by coach read policies).
CREATE OR REPLACE FUNCTION public.is_coach_of(_client uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = auth.uid() AND user_id = _client AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.assign_demo_to_all_coaches(p_demo_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  INSERT INTO public.coach_assignments (coach_id, user_id, status, is_demo)
  SELECT cp.user_id, p_demo_user_id, 'active', true
  FROM public.coach_profiles cp
  ON CONFLICT (coach_id, user_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_coach_profile(
  p_bio text,
  p_display_name text,
  target_user_id uuid
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  INSERT INTO public.coach_profiles (user_id, bio, display_name)
  VALUES (target_user_id, p_bio, p_display_name)
  ON CONFLICT (user_id) DO UPDATE
    SET bio = EXCLUDED.bio,
        display_name = EXCLUDED.display_name,
        updated_at = now();
  RETURN true;
END;
$$;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blob_tree_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_strategies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disc_assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mbti_assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_commitments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_recommendations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_paths         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step1_assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strengths_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_map_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_of_life_assessments ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- assessment_responses
CREATE POLICY "Users manage own responses" ON public.assessment_responses FOR ALL USING (auth.uid() = user_id);

-- assessments
CREATE POLICY "Users manage own assessments" ON public.assessments FOR ALL USING (auth.uid() = user_id);

-- aura_sessions
CREATE POLICY "Users manage own aura sessions" ON public.aura_sessions FOR ALL USING (auth.uid() = user_id);

-- blob_tree_assessments
CREATE POLICY "Users manage own blob tree" ON public.blob_tree_assessments FOR ALL USING (auth.uid() = user_id);

-- career_strategies
CREATE POLICY "Users manage own career strategies" ON public.career_strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Coaches view assigned user strategies" ON public.career_strategies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.user_id = career_strategies.user_id AND ca.coach_id = auth.uid() AND ca.status = 'active'
  ));

-- coach_applications
CREATE POLICY "Users manage own applications" ON public.coach_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all applications" ON public.coach_applications FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update applications" ON public.coach_applications FOR UPDATE USING (public.is_admin(auth.uid()));

-- coach_assignments
CREATE POLICY "Users view own assignments" ON public.coach_assignments FOR SELECT USING (auth.uid() = user_id OR auth.uid() = coach_id);
CREATE POLICY "Admins manage all assignments" ON public.coach_assignments FOR ALL USING (public.is_admin(auth.uid()));

-- coach_messages
CREATE POLICY "Participants can view messages" ON public.coach_messages FOR SELECT
  USING (public.is_assignment_participant(assignment_id, auth.uid()));
CREATE POLICY "Participants can send messages" ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_assignment_participant(assignment_id, auth.uid()));
CREATE POLICY "Recipients can mark messages read" ON public.coach_messages FOR UPDATE
  USING (public.is_assignment_participant(assignment_id, auth.uid()) AND sender_id <> auth.uid());

-- coach_profiles
CREATE POLICY "Coaches manage own profile" ON public.coach_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view coach profiles" ON public.coach_profiles FOR SELECT USING (true);

-- disc_assessments
CREATE POLICY "Users manage own DISC" ON public.disc_assessments FOR ALL USING (auth.uid() = user_id);

-- mbti_assessments
CREATE POLICY "Users manage own MBTI" ON public.mbti_assessments FOR ALL USING (auth.uid() = user_id);

-- path_commitments
CREATE POLICY "Users manage own path commitments" ON public.path_commitments FOR ALL USING (auth.uid() = user_id);

-- path_recommendations
CREATE POLICY "Users manage own path recommendations" ON public.path_recommendations FOR ALL USING (auth.uid() = user_id);

-- personal_paths
CREATE POLICY "Users manage own paths" ON public.personal_paths FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Coaches can manage assigned mentee paths" ON public.personal_paths FOR ALL
  USING (public.is_coach_of(user_id)) WITH CHECK (public.is_coach_of(user_id));

-- Coaching access (coach read access to assigned clients, coach_requests policies,
-- request_coach / admin_* functions): see migration 20260930120000_coach_fixes.sql.

-- reality_reports
CREATE POLICY "Users manage own reality reports" ON public.reality_reports FOR ALL USING (auth.uid() = user_id);

-- step1_assessments
CREATE POLICY "Users manage own step1" ON public.step1_assessments FOR ALL USING (auth.uid() = user_id);

-- strengths_assessments
CREATE POLICY "Users manage own strengths" ON public.strengths_assessments FOR ALL USING (auth.uid() = user_id);

-- value_map_assessments
CREATE POLICY "Users manage own value map" ON public.value_map_assessments FOR ALL USING (auth.uid() = user_id);

-- weekly_execution_plans
CREATE POLICY "Users manage own plans" ON public.weekly_execution_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Coaches view assigned plans" ON public.weekly_execution_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.user_id = weekly_execution_plans.user_id AND ca.coach_id = auth.uid() AND ca.status = 'active'
  ));

-- wheel_of_life_assessments
CREATE POLICY "Users manage own wheel of life" ON public.wheel_of_life_assessments FOR ALL USING (auth.uid() = user_id);
