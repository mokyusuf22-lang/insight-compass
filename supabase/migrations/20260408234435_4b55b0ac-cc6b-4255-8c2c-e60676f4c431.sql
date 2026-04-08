
-- Add 'coach' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coach';

-- Coach profiles table
CREATE TABLE public.coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  specialties jsonb DEFAULT '[]'::jsonb,
  availability text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own profile" ON public.coach_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile" ON public.coach_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Coaches can insert own profile" ON public.coach_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view coach profiles" ON public.coach_profiles
  FOR SELECT USING (true);

-- Coach assignments table
CREATE TABLE public.coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, user_id)
);

ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their assignments" ON public.coach_assignments
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can view their coach assignment" ON public.coach_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can update their assignments" ON public.coach_assignments
  FOR UPDATE USING (auth.uid() = coach_id);

-- Coach messages table
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.coach_assignments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is part of an assignment
CREATE OR REPLACE FUNCTION public.is_assignment_participant(_user_id uuid, _assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE id = _assignment_id
      AND (coach_id = _user_id OR user_id = _user_id)
  )
$$;

CREATE POLICY "Participants can view messages" ON public.coach_messages
  FOR SELECT USING (public.is_assignment_participant(auth.uid(), assignment_id));

CREATE POLICY "Participants can send messages" ON public.coach_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND public.is_assignment_participant(auth.uid(), assignment_id)
  );

CREATE POLICY "Recipients can mark messages read" ON public.coach_messages
  FOR UPDATE USING (
    public.is_assignment_participant(auth.uid(), assignment_id)
    AND sender_id != auth.uid()
  );

-- Timestamps triggers
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_assignments_updated_at
  BEFORE UPDATE ON public.coach_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_messages;
