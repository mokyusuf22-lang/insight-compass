
-- Create Blob Tree assessments table
CREATE TABLE public.blob_tree_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  current_blob INTEGER,
  desired_blob INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blob_tree_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blob tree assessments"
ON public.blob_tree_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blob tree assessments"
ON public.blob_tree_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blob tree assessments"
ON public.blob_tree_assessments FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_blob_tree_updated_at
BEFORE UPDATE ON public.blob_tree_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
