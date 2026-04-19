-- ═══════════════════════════════════════════════════════════════════════════════
-- PASTE THIS ENTIRE FILE INTO THE SUPABASE SQL EDITOR AND RUN IT.
-- Safe to re-run — every statement uses IF NOT EXISTS / OR REPLACE.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Add 'coach' to the app_role enum (if not already there) ────────────────
--    Note: ALTER TYPE ADD VALUE cannot run inside a transaction, which is fine
--    in the SQL editor (it runs outside one by default).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coach';


-- ── 2. coach_profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio          TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_profiles' AND policyname = 'Coaches manage own profile'
  ) THEN
    CREATE POLICY "Coaches manage own profile"
      ON public.coach_profiles FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_profiles' AND policyname = 'Admins can see all coach profiles'
  ) THEN
    CREATE POLICY "Admins can see all coach profiles"
      ON public.coach_profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;


-- ── 3. coach_assignments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  notes      TEXT,
  is_demo    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, user_id)
);

ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_assignments' AND policyname = 'Coaches can manage their assignments'
  ) THEN
    CREATE POLICY "Coaches can manage their assignments"
      ON public.coach_assignments FOR ALL
      USING (auth.uid() = coach_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_assignments' AND policyname = 'Admins can see all assignments'
  ) THEN
    CREATE POLICY "Admins can see all assignments"
      ON public.coach_assignments FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_assignments' AND policyname = 'Users can see their own assignments'
  ) THEN
    CREATE POLICY "Users can see their own assignments"
      ON public.coach_assignments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ── 4. coach_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_messages' AND policyname = 'Conversation participants can read messages'
  ) THEN
    CREATE POLICY "Conversation participants can read messages"
      ON public.coach_messages FOR SELECT
      USING (auth.uid() = coach_id OR auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_messages' AND policyname = 'Participants can send messages'
  ) THEN
    CREATE POLICY "Participants can send messages"
      ON public.coach_messages FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
        AND (auth.uid() = coach_id OR auth.uid() = user_id)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_messages' AND policyname = 'Participants can mark messages read'
  ) THEN
    CREATE POLICY "Participants can mark messages read"
      ON public.coach_messages FOR UPDATE
      USING (auth.uid() = coach_id OR auth.uid() = user_id)
      WITH CHECK (auth.uid() = coach_id OR auth.uid() = user_id);
  END IF;
END $$;


-- ── 5. Enable realtime for messaging ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_messages;


-- ── 6. assign_demo_to_all_coaches helper ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_demo_to_all_coaches(p_demo_user_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.coach_assignments (coach_id, user_id, status, is_demo)
  SELECT cp.user_id, p_demo_user_id, 'active', true
  FROM public.coach_profiles cp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = cp.user_id AND ca.user_id = p_demo_user_id
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

NOTIFY pgrst, 'reload schema';
