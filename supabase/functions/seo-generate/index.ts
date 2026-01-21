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
    const { companyDescription, targetAudience, queries, competitorAnalysis, url } = await req.json();

    if (!companyDescription || !queries || !competitorAnalysis) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const userId = await getVerifiedUserId(req);
    if (userId) {
      const { allowed, error } = await checkApiRateLimit(userId, 'generate-requests');
      
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

    const apiKey = Deno.env.get('LLAMA_API_KEY');
    if (!apiKey) {
      console.error('LLAMA_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating SEO content for:', url);

    const systemPrompt = `You are an expert SEO content writer. Your task is to create high-quality HTML content that will help a website rank for specific search queries.

Create content that:
1. Naturally incorporates target keywords
2. Provides genuine value to readers
3. Follows SEO best practices (proper headings, meta descriptions, semantic HTML)
4. Addresses the content gaps identified in competitor analysis
5. Is well-structured with clear sections

Output valid HTML that can be directly inserted into a CMS or webpage.`;

    const userPrompt = `Create SEO-optimized HTML content for this company:

Company: ${companyDescription}
Target Audience: ${targetAudience}
Website: ${url}

Target Search Queries:
${queries.slice(0, 5).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Competitor Analysis:
${JSON.stringify(competitorAnalysis.slice(0, 3), null, 2)}

Create a comprehensive HTML article (1500-2000 words) that:
1. Targets the primary search queries
2. Fills the content gaps identified in competitor analysis
3. Provides unique value and insights
4. Includes proper SEO elements (title, meta description, headings, internal link suggestions)
5. Has clear calls-to-action

Return only valid HTML starting with <!DOCTYPE html>.`;

    const response = await fetch('https://api.llama.com/compat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Llama API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Content generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    let html = aiResponse.choices?.[0]?.message?.content || '';

    // Clean up the HTML if it's wrapped in code blocks
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated HTML content length:', html.length);

    // Record usage after successful operation
    if (userId) {
      await recordUsageEvent(userId, 'generate-requests', 1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          html,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
