-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_profiles table for multiple companies per user
CREATE TABLE public.company_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    website_url TEXT,
    description TEXT,
    target_audience TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_sources table for images, audio, video files
CREATE TABLE public.media_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('image', 'audio', 'video', 'document')),
    file_url TEXT,
    file_name TEXT,
    description TEXT,
    embedding_status TEXT NOT NULL DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
    embedding_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_sources table for YouTube/Spotify integration
CREATE TABLE public.playlist_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify')),
    playlist_url TEXT NOT NULL,
    playlist_name TEXT,
    import_status TEXT NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'processing', 'completed', 'failed')),
    imported_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_results table to store SEO analysis per company
CREATE TABLE public.analysis_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
    queries JSONB,
    competitor_data JSONB,
    generated_html TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Company profiles policies
CREATE POLICY "Users can view their own company profiles" 
ON public.company_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create company profiles" 
ON public.company_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profiles" 
ON public.company_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company profiles" 
ON public.company_profiles FOR DELETE 
USING (auth.uid() = user_id);

-- Media sources policies (through company profile ownership)
CREATE POLICY "Users can view media for their companies" 
ON public.media_sources FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = media_sources.company_profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can add media to their companies" 
ON public.media_sources FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = media_sources.company_profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete media from their companies" 
ON public.media_sources FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = media_sources.company_profile_id AND user_id = auth.uid()
));

-- Playlist sources policies
CREATE POLICY "Users can view playlists for their companies" 
ON public.playlist_sources FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = playlist_sources.company_profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can add playlists to their companies" 
ON public.playlist_sources FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = playlist_sources.company_profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete playlists from their companies" 
ON public.playlist_sources FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = playlist_sources.company_profile_id AND user_id = auth.uid()
));

-- Analysis results policies
CREATE POLICY "Users can view analysis for their companies" 
ON public.analysis_results FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = analysis_results.company_profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create analysis for their companies" 
ON public.analysis_results FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = analysis_results.company_profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete analysis from their companies" 
ON public.analysis_results FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE id = analysis_results.company_profile_id AND user_id = auth.uid()
));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at
    BEFORE UPDATE ON public.company_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();