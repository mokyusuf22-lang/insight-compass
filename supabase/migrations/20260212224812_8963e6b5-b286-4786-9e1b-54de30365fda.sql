
-- Create value_map_assessments table
CREATE TABLE public.value_map_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  selected_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_five JSONB NOT NULL DEFAULT '[]'::jsonb,
  ranked_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.value_map_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own value map assessments"
ON public.value_map_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own value map assessments"
ON public.value_map_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own value map assessments"
ON public.value_map_assessments FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_value_map_assessments_updated_at
BEFORE UPDATE ON public.value_map_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
