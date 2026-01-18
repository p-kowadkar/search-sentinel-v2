const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
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

Analyze the provided website content and return a JSON response with:
- companyDescription: A brief 2-3 sentence description of what the company does
- targetAudience: Who their ideal customers are
- queries: An array of 10-15 search queries

The queries should be:
- Specific enough to be actionable
- Include a mix of informational and transactional intent
- Cover different stages of the buyer journey`;

    const userPrompt = `Analyze this website content and generate SEO queries:

Website URL: ${url}

Content:
${content.substring(0, 15000)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'seo_analysis',
              description: 'Return the SEO analysis results',
              parameters: {
                type: 'object',
                properties: {
                  companyDescription: {
                    type: 'string',
                    description: 'A brief description of what the company does',
                  },
                  targetAudience: {
                    type: 'string',
                    description: 'Who the ideal customers are',
                  },
                  queries: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of 10-15 search queries',
                  },
                },
                required: ['companyDescription', 'targetAudience', 'queries'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'seo_analysis' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log(`Generated ${analysis.queries?.length || 0} queries`);

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
