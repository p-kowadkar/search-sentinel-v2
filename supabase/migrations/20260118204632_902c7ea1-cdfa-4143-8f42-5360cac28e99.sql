-- Create table for storing linked social media accounts
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'twitter', 'linkedin', 'facebook', 'reddit'
  account_name TEXT, -- Display name / username
  access_token TEXT, -- Encrypted token (for future OAuth)
  refresh_token TEXT, -- For OAuth refresh
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own accounts
CREATE POLICY "Users can view their own social accounts"
ON public.social_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert their own social accounts"
ON public.social_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update their own social accounts"
ON public.social_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete their own social accounts"
ON public.social_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_social_accounts_updated_at
BEFORE UPDATE ON public.social_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();