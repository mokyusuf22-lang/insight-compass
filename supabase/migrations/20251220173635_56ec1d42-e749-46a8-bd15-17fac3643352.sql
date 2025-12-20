-- Create table for Step 1 assessment results
CREATE TABLE public.step1_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- MBTI axis scores
  axis_scores JSONB NOT NULL DEFAULT '{"E":0,"I":0,"S":0,"N":0,"T":0,"F":0,"J":0,"P":0}',
  
  -- Career context
  user_current_role TEXT,
  user_target_role TEXT,
  biggest_challenge TEXT,
  time_horizon TEXT,
  
  -- AI hypothesis response
  ai_hypothesis JSONB,
  
  -- Status
  is_complete BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.step1_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own step1 assessments" 
ON public.step1_assessments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own step1 assessments" 
ON public.step1_assessments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own step1 assessments" 
ON public.step1_assessments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_step1_assessments_updated_at
BEFORE UPDATE ON public.step1_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add step1_completed flag to profiles to gate Step 2
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS step1_completed BOOLEAN NOT NULL DEFAULT false;