import { checkApiRateLimit, recordUsageEvent } from '../_shared/flowglad.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Securely extract and verify user ID from authorization header using Supabase JWT validation
async function getVerifiedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getClaims(token);
    
    if (error || !data?.claims?.sub) {
      return null;
    }
    
    return data.claims.sub;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, companyUrl } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const userId = await getVerifiedUserId(req);
    if (userId) {
      const { allowed, error } = await checkApiRateLimit(userId, 'search-requests');
      
      if (!allowed) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error?.message || 'Rate limit exceeded. Please upgrade your plan.',
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Search not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query);

    // Use Perplexity to search and get grounded results
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are analyzing search results for SEO purposes. For the given query, identify the top 5 ranking websites/pages and analyze why they rank well. Focus on:
- Content quality and depth
- Key topics covered
- SEO techniques used (headings, keywords, etc.)
- Unique value propositions

Return structured insights about each competitor.`,
          },
          {
            role: 'user',
            content: `Search query: "${query}"

The company ${companyUrl} wants to rank for this query. Analyze the top 5 results and explain:
1. What are the top 5 ranking URLs for this query?
2. What key content elements make them rank well?
3. What content gaps could ${companyUrl} fill to compete?

Be specific about URLs and content strategies.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Extract competitor insights from the response
    const competitors = citations.slice(0, 5).map((url: string, index: number) => ({
      url,
      title: `Result ${index + 1}`,
      position: index + 1,
      insights: extractInsights(content, index),
    }));

    // If no citations, create placeholder competitors
    if (competitors.length === 0) {
      for (let i = 0; i < 3; i++) {
        competitors.push({
          url: `https://competitor${i + 1}.com`,
          title: `Competitor ${i + 1}`,
          position: i + 1,
          insights: ['Strong content relevance', 'Good keyword optimization', 'Quality backlinks'],
        });
      }
    }

    // Record usage after successful operation
    if (userId) {
      await recordUsageEvent(userId, 'search-requests', 1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          query,
          analysis: content,
          competitors,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractInsights(content: string, index: number): string[] {
  const defaultInsights = [
    'Comprehensive content coverage',
    'Strong keyword optimization',
    'Quality backlink profile',
    'Good user experience signals',
  ];

  const insights: string[] = [];
  
  const patterns = [
    /strong ([\w\s]+) content/gi,
    /comprehensive ([\w\s]+)/gi,
    /high-quality ([\w\s]+)/gi,
    /optimized ([\w\s]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > index) {
      insights.push(matches[index]);
    }
  }

  if (insights.length < 2) {
    return defaultInsights.slice(0, 3);
  }

  return insights.slice(0, 3);
}
