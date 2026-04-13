
-- personal_paths: add coach_id if not exists
ALTER TABLE public.personal_paths ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Coaches can manage assigned mentee paths" ON public.personal_paths;

CREATE POLICY "Coaches can manage assigned mentee paths" ON public.personal_paths FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid()
      AND ca.user_id = personal_paths.user_id
      AND ca.status = 'active'
      AND public.has_role(auth.uid(), 'coach')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.coach_assignments ca
    WHERE ca.coach_id = auth.uid()
      AND ca.user_id = personal_paths.user_id
      AND ca.status = 'active'
      AND public.has_role(auth.uid(), 'coach')
  ));
