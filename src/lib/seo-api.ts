import { supabase } from '@/integrations/supabase/client';

export interface ScrapeResult {
  url: string;
  pages: string[];
  content: string;
  pageCount: number;
}

export interface AnalysisResult {
  companyDescription: string;
  targetAudience: string;
  queries: string[];
}

export interface CompetitorResult {
  url: string;
  title: string;
  position: number;
  insights: string[];
}

export interface SearchResult {
  query: string;
  analysis: string;
  competitors: CompetitorResult[];
}

export interface GenerateResult {
  html: string;
}

export interface ContentAnalysis {
  currentContentPros: string[];
  currentContentCons: string[];
  generatedContentImprovements: string[];
}

export interface ContentGuideline {
  title: string;
  currentGaps: string[];
  competitorStrengths: string[];
  recommendedApproach: string;
  keyDifferentiators: string[];
  targetWordCount: number;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  contentAnalysis: ContentAnalysis;
}

export interface QueryContent {
  html: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
}

export interface QueryContentResult {
  query: string;
  guideline: ContentGuideline;
  content: QueryContent;
}

// LLM Benchmark Types
export type LLMProvider = 'openai' | 'google' | 'xai' | 'perplexity';

export interface LLMBenchmarkResult {
  provider: LLMProvider;
  providerName: string;
  available: boolean;
  response?: string;
  relevanceScore?: number;
  keyTopics?: string[];
  error?: string;
}

export interface LLMComparisonResult {
  query: string;
  results: LLMBenchmarkResult[];
  correlationAnalysis?: string;
}

async function invokeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    console.error(`Error calling ${functionName}:`, error);
    return { success: false, error: error.message };
  }

  return data;
}

export const seoApi = {
  // Step 1: Scrape the target website
  async scrapeWebsite(url: string): Promise<{ success: boolean; data?: ScrapeResult; error?: string }> {
    return invokeFunction<ScrapeResult>('seo-scrape', { url });
  },

  // Step 2: Analyze content and generate queries
  async analyzeContent(
    content: string,
    url: string
  ): Promise<{ success: boolean; data?: AnalysisResult; error?: string }> {
    return invokeFunction<AnalysisResult>('seo-analyze', { content, url });
  },

  // Step 3: Search for a query and analyze competitors
  async searchQuery(
    query: string,
    companyUrl: string
  ): Promise<{ success: boolean; data?: SearchResult; error?: string }> {
    return invokeFunction<SearchResult>('seo-search', { query, companyUrl });
  },

  // Step 4: Generate SEO content (legacy - single output)
  async generateContent(
    companyDescription: string,
    targetAudience: string,
    queries: string[],
    competitorAnalysis: SearchResult[],
    url: string
  ): Promise<{ success: boolean; data?: GenerateResult; error?: string }> {
    return invokeFunction<GenerateResult>('seo-generate', {
      companyDescription,
      targetAudience,
      queries,
      competitorAnalysis,
      url,
    });
  },

  // Step 4b: Generate per-query content with guidelines
  async generateQueryContent(
    query: string,
    companyDescription: string,
    targetAudience: string,
    companyUrl: string,
    currentContent: string,
    competitorAnalysis: SearchResult
  ): Promise<{ success: boolean; data?: QueryContentResult; error?: string }> {
    return invokeFunction<QueryContentResult>('seo-generate-query', {
      query,
      companyDescription,
      targetAudience,
      companyUrl,
      currentContent,
      competitorAnalysis,
    });
  },

  // Step 5: Compare query across LLMs
  async compareLLMs(
    query: string
  ): Promise<{ success: boolean; data?: LLMComparisonResult; error?: string }> {
    return invokeFunction<LLMComparisonResult>('seo-llm-compare', { query });
  },
};
