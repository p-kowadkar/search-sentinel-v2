-- Add UPDATE policy for analysis_results table
CREATE POLICY "Users can update analysis for their companies"
ON public.analysis_results
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM company_profiles
  WHERE company_profiles.id = analysis_results.company_profile_id
  AND company_profiles.user_id = auth.uid()
));