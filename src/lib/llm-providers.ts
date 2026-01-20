// LLM Provider configurations for BYOK multi-model support
// Updated January 2025 with latest models

export type LLMProviderId = 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'xai' 
  | 'perplexity' 
  | 'deepseek' 
  | 'openrouter';

export type ScraperProviderId = 
  | 'firecrawl_default' 
  | 'firecrawl' 
  | 'serper' 
  | 'scraperapi' 
  | 'brightdata';

export interface LLMModel {
  id: string;
  name: string;
  description: string;
  supportsReasoning?: boolean;
  reasoningLevels?: string[];
}

export interface LLMProvider {
  id: LLMProviderId;
  name: string;
  description: string;
  icon: string;
  baseUrl: string;
  models: LLMModel[];
  envKeyName: string;
  docsUrl: string;
}

export interface ScraperProvider {
  id: ScraperProviderId;
  name: string;
  description: string;
  icon: string;
  requiresKey: boolean;
  docsUrl: string;
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-5.2 family with advanced reasoning capabilities',
    icon: '🤖',
    baseUrl: 'https://api.openai.com/v1',
    envKeyName: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/docs',
    models: [
      {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        description: 'Flagship model for coding and agentic tasks',
        supportsReasoning: true,
        reasoningLevels: ['none', 'low', 'medium', 'high', 'xhigh'],
      },
      {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        description: 'Balanced cost and performance',
        supportsReasoning: true,
        reasoningLevels: ['none', 'low', 'medium', 'high'],
      },
      {
        id: 'gpt-5-nano',
        name: 'GPT-5 Nano',
        description: 'Fast and cost-efficient for simple tasks',
        supportsReasoning: false,
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 4.5 family - safe, capable AI assistants',
    icon: '🧠',
    baseUrl: 'https://api.anthropic.com/v1',
    envKeyName: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://docs.anthropic.com',
    models: [
      {
        id: 'claude-opus-4.5',
        name: 'Claude Opus 4.5',
        description: 'Most capable model for complex tasks',
        supportsReasoning: true,
      },
      {
        id: 'claude-sonnet-4.5',
        name: 'Claude Sonnet 4.5',
        description: 'Balanced performance and efficiency',
        supportsReasoning: true,
      },
      {
        id: 'claude-haiku-4.5',
        name: 'Claude Haiku 4.5',
        description: 'Fast and lightweight',
        supportsReasoning: false,
      },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Gemini 2.5 & 3 series - multimodal AI',
    icon: '💎',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    envKeyName: 'GOOGLE_API_KEY',
    docsUrl: 'https://ai.google.dev/docs',
    models: [
      {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro Preview',
        description: 'Next-generation flagship model',
        supportsReasoning: true,
      },
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash Preview',
        description: 'Fast next-gen model',
        supportsReasoning: true,
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Top-tier for complex reasoning',
        supportsReasoning: true,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Balanced speed and capability',
        supportsReasoning: true,
      },
    ],
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    description: 'Grok 4 & 4-1 series - real-time knowledge',
    icon: '🚀',
    baseUrl: 'https://api.x.ai/v1',
    envKeyName: 'XAI_API_KEY',
    docsUrl: 'https://docs.x.ai',
    models: [
      {
        id: 'grok-4-1-fast-reasoning',
        name: 'Grok 4-1 Fast Reasoning',
        description: 'Latest with advanced reasoning',
        supportsReasoning: true,
      },
      {
        id: 'grok-4-1-fast-non-reasoning',
        name: 'Grok 4-1 Fast',
        description: 'Latest fast model',
        supportsReasoning: false,
      },
      {
        id: 'grok-4-fast-reasoning',
        name: 'Grok 4 Fast Reasoning',
        description: 'Advanced reasoning capabilities',
        supportsReasoning: true,
      },
      {
        id: 'grok-4-fast-non-reasoning',
        name: 'Grok 4 Fast',
        description: 'Quick responses',
        supportsReasoning: false,
      },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Sonar models - search-grounded AI',
    icon: '🔍',
    baseUrl: 'https://api.perplexity.ai',
    envKeyName: 'PERPLEXITY_API_KEY',
    docsUrl: 'https://docs.perplexity.ai',
    models: [
      {
        id: 'sonar-pro',
        name: 'Sonar Pro',
        description: 'Advanced search-grounded responses',
        supportsReasoning: true,
      },
      {
        id: 'sonar',
        name: 'Sonar',
        description: 'Fast search-grounded model',
        supportsReasoning: false,
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek models - efficient AI',
    icon: '🌊',
    baseUrl: 'https://api.deepseek.com/v1',
    envKeyName: 'DEEPSEEK_API_KEY',
    docsUrl: 'https://platform.deepseek.com/docs',
    models: [
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        description: 'Advanced reasoning model',
        supportsReasoning: true,
      },
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'General purpose chat model',
        supportsReasoning: false,
      },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 100+ models via single API',
    icon: '🌐',
    baseUrl: 'https://openrouter.ai/api/v1',
    envKeyName: 'OPENROUTER_API_KEY',
    docsUrl: 'https://openrouter.ai/docs',
    models: [], // User provides custom model ID
  },
];

export const SCRAPER_PROVIDERS: ScraperProvider[] = [
  {
    id: 'firecrawl_default',
    name: 'Firecrawl (Default)',
    description: 'Use the built-in Firecrawl API',
    icon: '🔥',
    requiresKey: false,
    docsUrl: 'https://firecrawl.dev/docs',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl (Your Key)',
    description: 'Use your own Firecrawl API key',
    icon: '🔥',
    requiresKey: true,
    docsUrl: 'https://firecrawl.dev/docs',
  },
  {
    id: 'serper',
    name: 'Serper',
    description: 'Google Search API for web scraping',
    icon: '🔎',
    requiresKey: true,
    docsUrl: 'https://serper.dev/docs',
  },
  {
    id: 'scraperapi',
    name: 'ScraperAPI',
    description: 'Handles proxies and CAPTCHAs',
    icon: '🕸️',
    requiresKey: true,
    docsUrl: 'https://www.scraperapi.com/documentation',
  },
  {
    id: 'brightdata',
    name: 'Bright Data',
    description: 'Enterprise-grade web data platform',
    icon: '💡',
    requiresKey: true,
    docsUrl: 'https://docs.brightdata.com',
  },
];

export function getProviderById(id: LLMProviderId): LLMProvider | undefined {
  return LLM_PROVIDERS.find(p => p.id === id);
}

export function getScraperById(id: ScraperProviderId): ScraperProvider | undefined {
  return SCRAPER_PROVIDERS.find(p => p.id === id);
}
