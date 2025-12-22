-- Create MBTI assessments table
CREATE TABLE public.mbti_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  current_question INTEGER NOT NULL DEFAULT 1,
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mbti_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own MBTI assessments"
ON public.mbti_assessments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MBTI assessments"
ON public.mbti_assessments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MBTI assessments"
ON public.mbti_assessments
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mbti_assessments_updated_at
BEFORE UPDATE ON public.mbti_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add mbti_completed flag to profiles
ALTER TABLE public.profiles
ADD COLUMN mbti_completed BOOLEAN NOT NULL DEFAULT false;