-- ─── Coach Tables Migration ───────────────────────────────────────────────────
-- Run this in your Supabase SQL editor or via the Supabase CLI.
--
-- New tables:
--   coach_profiles    — one row per coach user (role='coach' in user_roles)
--   coach_assignments — many-to-many: coaches <-> users
--   coach_messages    — in-app messaging between coach and user

-- 1. coach_profiles ─────────────────────────────────────────────────────────
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

-- Coaches can read/write their own profile
CREATE POLICY "Coaches manage own profile"
  ON public.coach_profiles
  FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('coach', 'admin')
    )
  );

-- Admins can see all coach profiles
CREATE POLICY "Admins can see all coach profiles"
  ON public.coach_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- 2. coach_assignments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, user_id)
);

ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches can see/manage their own assignments
CREATE POLICY "Coaches can manage their assignments"
  ON public.coach_assignments
  FOR ALL
  USING (
    auth.uid() = coach_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('coach', 'admin')
    )
  );

-- Admins can see all assignments
CREATE POLICY "Admins can see all assignments"
  ON public.coach_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can see their own assignments (to know they have a coach)
CREATE POLICY "Users can see their own assignments"
  ON public.coach_assignments
  FOR SELECT
  USING (auth.uid() = user_id);


-- 3. coach_messages ───────────────────────────────────────────────────────────
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

-- Both parties in a conversation can read messages
CREATE POLICY "Conversation participants can read messages"
  ON public.coach_messages
  FOR SELECT
  USING (
    auth.uid() = coach_id
    OR auth.uid() = user_id
  );

-- Both parties can insert messages (sender_id must match current user)
CREATE POLICY "Participants can send messages"
  ON public.coach_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (auth.uid() = coach_id OR auth.uid() = user_id)
  );

-- Coaches can mark messages as read
CREATE POLICY "Coaches can mark messages read"
  ON public.coach_messages
  FOR UPDATE
  USING (auth.uid() = coach_id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = coach_id OR auth.uid() = user_id);


-- 4. Role expansion — add 'coach' to the allowed roles check ─────────────────
-- If user_roles.role has a CHECK constraint, you may need to update it:
-- ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
-- ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'coach'));


-- 5. Realtime — enable for messaging ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_messages;
