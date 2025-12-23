-- Create career_strategies table to store AI-generated strategies
CREATE TABLE public.career_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mbti_result JSONB,
  disc_result JSONB,
  strengths_result JSONB,
  career_goals JSONB,
  strategy JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.career_strategies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own strategies" 
ON public.career_strategies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies" 
ON public.career_strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies" 
ON public.career_strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_career_strategies_updated_at
BEFORE UPDATE ON public.career_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add strategy_generated flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS strategy_generated boolean NOT NULL DEFAULT false;