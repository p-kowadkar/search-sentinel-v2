-- Create user_api_keys table for BYOK
CREATE TABLE public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_id TEXT, -- For OpenRouter custom model IDs
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own API keys"
  ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_scraper_config table for scraper settings
CREATE TABLE public.user_scraper_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  active_provider TEXT NOT NULL DEFAULT 'firecrawl_default', -- firecrawl_default, firecrawl, serper, scraperapi, brightdata
  api_key TEXT, -- Only needed if not using firecrawl_default
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_scraper_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scraper config"
  ON public.user_scraper_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraper config"
  ON public.user_scraper_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraper config"
  ON public.user_scraper_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraper config"
  ON public.user_scraper_config FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_scraper_config_updated_at
  BEFORE UPDATE ON public.user_scraper_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();