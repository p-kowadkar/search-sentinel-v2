import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LLMProviderId, ScraperProviderId } from '@/lib/llm-providers';
import { toast } from 'sonner';

export interface UserApiKey {
  id: string;
  provider: LLMProviderId;
  api_key: string;
  model_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserScraperConfig {
  id: string;
  active_provider: ScraperProviderId;
  api_key: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserApiKeys() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [scraperConfig, setScraperConfig] = useState<UserScraperConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setScraperConfig(null);
      setLoading(false);
      return;
    }

    try {
      const [keysResult, scraperResult] = await Promise.all([
        supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('user_scraper_config')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (keysResult.error && keysResult.error.code !== 'PGRST116') {
        console.error('Error fetching API keys:', keysResult.error);
      } else {
        setApiKeys((keysResult.data as UserApiKey[]) || []);
      }

      if (scraperResult.error && scraperResult.error.code !== 'PGRST116') {
        console.error('Error fetching scraper config:', scraperResult.error);
      } else {
        setScraperConfig(scraperResult.data as UserScraperConfig | null);
      }
    } catch (error) {
      console.error('Error fetching user API keys:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const saveApiKey = async (
    provider: LLMProviderId,
    apiKey: string,
    modelId?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to save API keys');
      return false;
    }

    try {
      const existingKey = apiKeys.find(k => k.provider === provider);
      
      if (existingKey) {
        const { error } = await supabase
          .from('user_api_keys')
          .update({
            api_key: apiKey,
            model_id: modelId || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingKey.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: user.id,
            provider,
            api_key: apiKey,
            model_id: modelId || null,
            is_active: true,
          });

        if (error) throw error;
      }

      await fetchApiKeys();
      toast.success(`${provider} API key saved successfully`);
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
      return false;
    }
  };

  const deleteApiKey = async (provider: LLMProviderId): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;

      await fetchApiKeys();
      toast.success(`${provider} API key removed`);
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to remove API key');
      return false;
    }
  };

  const saveScraperConfig = async (
    activeProvider: ScraperProviderId,
    apiKey?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to save scraper settings');
      return false;
    }

    try {
      if (scraperConfig) {
        const { error } = await supabase
          .from('user_scraper_config')
          .update({
            active_provider: activeProvider,
            api_key: apiKey || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', scraperConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_scraper_config')
          .insert({
            user_id: user.id,
            active_provider: activeProvider,
            api_key: apiKey || null,
          });

        if (error) throw error;
      }

      await fetchApiKeys();
      toast.success('Scraper settings saved');
      return true;
    } catch (error) {
      console.error('Error saving scraper config:', error);
      toast.error('Failed to save scraper settings');
      return false;
    }
  };

  const getConfiguredProviders = (): LLMProviderId[] => {
    return apiKeys.filter(k => k.is_active).map(k => k.provider);
  };

  const hasApiKey = (provider: LLMProviderId): boolean => {
    return apiKeys.some(k => k.provider === provider && k.is_active);
  };

  const getApiKey = (provider: LLMProviderId): string | null => {
    const key = apiKeys.find(k => k.provider === provider && k.is_active);
    return key?.api_key || null;
  };

  const getModelId = (provider: LLMProviderId): string | null => {
    const key = apiKeys.find(k => k.provider === provider && k.is_active);
    return key?.model_id || null;
  };

  return {
    apiKeys,
    scraperConfig,
    loading,
    saveApiKey,
    deleteApiKey,
    saveScraperConfig,
    getConfiguredProviders,
    hasApiKey,
    getApiKey,
    getModelId,
    refetch: fetchApiKeys,
  };
}
