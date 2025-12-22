-- Add career_goals JSON to profiles table
ALTER TABLE public.profiles 
ADD COLUMN career_goals jsonb DEFAULT NULL;

-- Add disc_completed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN disc_completed boolean NOT NULL DEFAULT false;

-- Create DISC assessments table
CREATE TABLE public.disc_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  is_complete boolean NOT NULL DEFAULT false,
  current_question integer NOT NULL DEFAULT 1,
  responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disc_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for disc_assessments
CREATE POLICY "Users can view their own DISC assessments" 
ON public.disc_assessments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DISC assessments" 
ON public.disc_assessments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DISC assessments" 
ON public.disc_assessments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add updated_at trigger for disc_assessments
CREATE TRIGGER update_disc_assessments_updated_at
BEFORE UPDATE ON public.disc_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();