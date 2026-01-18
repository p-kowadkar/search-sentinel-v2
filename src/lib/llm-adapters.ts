// LLM Adapter configurations for multi-model benchmarking
// Each adapter defines how to connect to different LLM providers

export interface LLMAdapter {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'xai' | 'perplexity';
  enabled: boolean;
  description: string;
  envKey: string;
}

export const LLM_ADAPTERS: LLMAdapter[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    provider: 'openai',
    enabled: true,
    description: 'OpenAI GPT models for comprehensive content analysis',
    envKey: 'OPENAI_API_KEY',
  },
  {
    id: 'google',
    name: 'Gemini',
    provider: 'google',
    enabled: true,
    description: 'Google Gemini for multi-modal understanding',
    envKey: 'GOOGLE_API_KEY',
  },
  {
    id: 'xai',
    name: 'Grok',
    provider: 'xai',
    enabled: false, // Disabled - no working API key currently
    description: 'xAI Grok for real-time web knowledge (currently unavailable)',
    envKey: 'XAI_API_KEY',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    provider: 'perplexity',
    enabled: true,
    description: 'Perplexity Sonar for grounded search results',
    envKey: 'PERPLEXITY_API_KEY',
  },
];

export function getEnabledAdapters(): LLMAdapter[] {
  return LLM_ADAPTERS.filter(adapter => adapter.enabled);
}

export function getAdapterById(id: string): LLMAdapter | undefined {
  return LLM_ADAPTERS.find(adapter => adapter.id === id);
}