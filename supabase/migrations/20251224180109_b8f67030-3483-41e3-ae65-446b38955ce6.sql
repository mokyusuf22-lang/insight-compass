-- Create weekly_execution_plans table
CREATE TABLE public.weekly_execution_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_id UUID REFERENCES public.career_strategies(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL DEFAULT 1,
  week_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_phase TEXT,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  coaching_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_execution_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own weekly plans" 
ON public.weekly_execution_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans" 
ON public.weekly_execution_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans" 
ON public.weekly_execution_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_execution_plans_updated_at
BEFORE UPDATE ON public.weekly_execution_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();