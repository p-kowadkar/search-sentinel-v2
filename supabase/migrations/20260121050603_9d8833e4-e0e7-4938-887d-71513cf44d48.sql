-- Add UPDATE policy for media_sources table
CREATE POLICY "Users can update media for their companies"
ON public.media_sources
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.company_profiles
  WHERE company_profiles.id = media_sources.company_profile_id
  AND company_profiles.user_id = auth.uid()
));

-- Add UPDATE policy for playlist_sources table
CREATE POLICY "Users can update playlists for their companies"
ON public.playlist_sources
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.company_profiles
  WHERE company_profiles.id = playlist_sources.company_profile_id
  AND company_profiles.user_id = auth.uid()
));

-- Fix handle_new_user function with empty search_path for better security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$function$;