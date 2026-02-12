
-- Add new flow progress flags to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blob_tree_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS value_map_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reality_report_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS path_options_shown boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS path_committed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS personal_path_generated boolean NOT NULL DEFAULT false;

-- Create reality_reports table
CREATE TABLE public.reality_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  blob_tree_summary jsonb,
  value_map_summary jsonb,
  key_constraints jsonb,
  risks jsonb,
  strengths jsonb,
  generated_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.reality_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reality reports" ON public.reality_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reality reports" ON public.reality_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reality reports" ON public.reality_reports FOR UPDATE USING (auth.uid() = user_id);

-- Create path_recommendations table
CREATE TABLE public.path_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_path_index integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.path_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own path recommendations" ON public.path_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own path recommendations" ON public.path_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own path recommendations" ON public.path_recommendations FOR UPDATE USING (auth.uid() = user_id);

-- Create path_commitments table
CREATE TABLE public.path_commitments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  chosen_path jsonb NOT NULL,
  intent text,
  time_budget text,
  focus_area text,
  constraints text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.path_commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own path commitments" ON public.path_commitments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own path commitments" ON public.path_commitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own path commitments" ON public.path_commitments FOR UPDATE USING (auth.uid() = user_id);

-- Create personal_paths table
CREATE TABLE public.personal_paths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_progress integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.personal_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own personal paths" ON public.personal_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own personal paths" ON public.personal_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own personal paths" ON public.personal_paths FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_reality_reports_updated_at BEFORE UPDATE ON public.reality_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_path_recommendations_updated_at BEFORE UPDATE ON public.path_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_path_commitments_updated_at BEFORE UPDATE ON public.path_commitments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_paths_updated_at BEFORE UPDATE ON public.personal_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
