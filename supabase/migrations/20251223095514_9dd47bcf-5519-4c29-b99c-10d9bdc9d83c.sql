-- Add strengths_completed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS strengths_completed boolean NOT NULL DEFAULT false;

-- Create strengths_assessments table
CREATE TABLE public.strengths_assessments (
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
ALTER TABLE public.strengths_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own Strengths assessments" 
ON public.strengths_assessments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Strengths assessments" 
ON public.strengths_assessments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Strengths assessments" 
ON public.strengths_assessments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_strengths_assessments_updated_at
BEFORE UPDATE ON public.strengths_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();