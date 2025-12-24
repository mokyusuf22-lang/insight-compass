-- Add skill_development_plan column to career_strategies table
ALTER TABLE public.career_strategies 
ADD COLUMN IF NOT EXISTS skill_development_plan JSONB DEFAULT NULL;