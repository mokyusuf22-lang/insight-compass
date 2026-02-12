
-- Create Wheel of Life assessments table
CREATE TABLE public.wheel_of_life_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wheel_of_life_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own WoL assessments"
ON public.wheel_of_life_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WoL assessments"
ON public.wheel_of_life_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WoL assessments"
ON public.wheel_of_life_assessments FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wheel_of_life_updated_at
BEFORE UPDATE ON public.wheel_of_life_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
