
CREATE TABLE public.aura_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT,
  email TEXT,
  preferred_contact TEXT,
  challenge_text TEXT,
  identified_themes JSONB DEFAULT '[]'::jsonb,
  aura_summary TEXT,
  user_confirmed BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.aura_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own aura sessions"
  ON public.aura_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aura sessions"
  ON public.aura_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aura sessions"
  ON public.aura_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
