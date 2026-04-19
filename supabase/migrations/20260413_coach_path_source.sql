-- ─── Coach Path Source Migration ─────────────────────────────────────────────
-- Adds coach_id to personal_paths so coaches can create paths for their mentees,
-- and adds the RLS policy that allows coaches to manage mentee paths.

ALTER TABLE public.personal_paths
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id);

-- Allow coaches to insert / update / delete paths for their assigned mentees
CREATE POLICY "Coaches can manage assigned mentee paths"
  ON public.personal_paths
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.coach_assignments ca
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE ca.coach_id = auth.uid()
        AND ca.user_id = personal_paths.user_id
        AND ca.status = 'active'
        AND ur.role IN ('coach', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.coach_assignments ca
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE ca.coach_id = auth.uid()
        AND ca.user_id = personal_paths.user_id
        AND ca.status = 'active'
        AND ur.role IN ('coach', 'admin')
    )
  );
