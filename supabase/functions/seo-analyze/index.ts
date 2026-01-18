import { checkApiRateLimit, recordUsageEvent } from '@shared/flowglad.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract user ID from authorization header
function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, url } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const userId = getUserIdFromRequest(req);
    if (userId) {
      const { allowed, error } = await checkApiRateLimit(userId, 'analyze-requests');
      
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

    console.log('Analyzing content for:', url);

    const systemPrompt = `You are an SEO expert analyzing a company's website content. Your task is to:
1. Understand what the company does, their products/services, and target audience
2. Generate 10-15 strategic search queries that potential customers might use to find solutions like this company offers
3. Focus on high-intent, commercial queries that indicate buying intent

You MUST respond with a valid JSON object containing:
- companyDescription: A brief 2-3 sentence description of what the company does
- targetAudience: Who their ideal customers are
- queries: An array of 10-15 search queries

The queries should be:
- Specific enough to be actionable
- Include a mix of informational and transactional intent
- Cover different stages of the buyer journey

IMPORTANT: Return ONLY valid JSON, no markdown or other text.`;

    const userPrompt = `Analyze this website content and generate SEO queries:

Website URL: ${url}

Content:
${content.substring(0, 15000)}

Respond with a JSON object containing companyDescription, targetAudience, and queries array.`;

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
        max_tokens: 2048,
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
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const messageContent = aiResponse.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      console.error('No content in response');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response, handling potential markdown code blocks
    let analysis;
    try {
      let jsonStr = messageContent.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', messageContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generated ${analysis.queries?.length || 0} queries`);

    // Record usage after successful operation
    if (userId) {
      await recordUsageEvent(userId, 'analyze-requests', 1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-analyze:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
