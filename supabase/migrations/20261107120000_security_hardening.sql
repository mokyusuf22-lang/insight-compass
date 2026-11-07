-- Security hardening (security review, 7 Nov 2026). Safe to run more than once.
--
-- 1. bootstrap_admin: anyone signed in (now including guests) could make themselves admin
--    while no admin existed. Lock it to the SQL editor / service role only.
-- 2. coach_profiles: coaches could set is_primary / max_clients on their own row, and any
--    user could create a coach profile. Only coaches may write their profile, and only
--    admins may change is_primary / max_clients. Profiles are readable by signed-in users only.
-- 3. user_consents: an append-only record of what each user agreed to, and when.
-- 4. ai_usage + consume_ai_quota(): per-user daily limits on AI calls (each call costs money,
--    and guest accounts make new users free to create).

-- ── 1. bootstrap_admin ──────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.bootstrap_admin(uuid) FROM PUBLIC, anon, authenticated;
-- To create the first admin, run in the SQL editor:
--   INSERT INTO public.user_roles (user_id, role) VALUES ('<user id>', 'admin');

-- ── 2. coach_profiles ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view coach profiles" ON public.coach_profiles;
CREATE POLICY "Anyone can view coach profiles" ON public.coach_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Coaches can insert own profile" ON public.coach_profiles;
CREATE POLICY "Coaches can insert own profile" ON public.coach_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'coach'));

DROP POLICY IF EXISTS "Coaches can update own profile" ON public.coach_profiles;
CREATE POLICY "Coaches can update own profile" ON public.coach_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'coach'));

CREATE OR REPLACE FUNCTION public.protect_coach_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is NULL in the SQL editor / service role, which may change anything.
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_primary := false;
    NEW.max_clients := 15;
  ELSE
    NEW.is_primary := OLD.is_primary;
    NEW.max_clients := OLD.max_clients;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_coach_admin_fields ON public.coach_profiles;
CREATE TRIGGER protect_coach_admin_fields
  BEFORE INSERT OR UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_coach_admin_fields();

-- ── 3. user_consents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN (
    'terms_privacy', 'age_16', 'ai_processing', 'sensitive_data', 'coach_access', 'marketing_email'
  )),
  granted boolean NOT NULL,
  policy_version text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_consents_user_idx ON public.user_consents (user_id, consent_type, created_at DESC);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Append-only: users add and read their own rows; nobody edits history. Withdrawing consent
-- is a new row with granted = false.
DROP POLICY IF EXISTS "Users read own consents" ON public.user_consents;
CREATE POLICY "Users read own consents" ON public.user_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users add own consents" ON public.user_consents;
CREATE POLICY "Users add own consents" ON public.user_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read consents" ON public.user_consents;
CREATE POLICY "Admins read consents" ON public.user_consents
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ── 4. AI usage limits ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_kind_idx ON public.ai_usage (user_id, kind, created_at DESC);

-- RLS on with no policies: users can't read or write it directly, only via the function below.
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Records one AI call for the current user and returns false if they're over the limit.
-- Limits live here (not in the request) so a user can't raise their own.
CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_kind text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_daily int;
  v_burst int := 10;  -- per 10 minutes, any kind
  v_count int;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  v_daily := CASE p_kind
    WHEN 'themes' THEN 30
    WHEN 'plan'   THEN 15
    WHEN 'qa'     THEN 60
    ELSE NULL
  END;
  IF v_daily IS NULL THEN RAISE EXCEPTION 'Unknown AI usage kind'; END IF;

  SELECT count(*) INTO v_count FROM public.ai_usage
   WHERE user_id = v_uid AND created_at > now() - interval '10 minutes';
  IF v_count >= v_burst THEN RETURN false; END IF;

  SELECT count(*) INTO v_count FROM public.ai_usage
   WHERE user_id = v_uid AND kind = p_kind AND created_at > now() - interval '1 day';
  IF v_count >= v_daily THEN RETURN false; END IF;

  INSERT INTO public.ai_usage (user_id, kind) VALUES (v_uid, p_kind);
  -- Keep the table small.
  DELETE FROM public.ai_usage WHERE user_id = v_uid AND created_at < now() - interval '2 days';
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text) TO authenticated;

-- ── 5. Message size limit ───────────────────────────────────────────────────
-- Stops someone filling the database (or a coach's inbox) with huge messages.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coach_messages_content_length') THEN
    ALTER TABLE public.coach_messages
      ADD CONSTRAINT coach_messages_content_length CHECK (char_length(content) BETWEEN 1 AND 5000) NOT VALID;
  END IF;
END $$;
