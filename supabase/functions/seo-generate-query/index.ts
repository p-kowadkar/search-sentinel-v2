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

export interface QueryContentResult {
  query: string;
  guideline: {
    title: string;
    currentGaps: string[];
    competitorStrengths: string[];
    recommendedApproach: string;
    keyDifferentiators: string[];
    targetWordCount: number;
    primaryKeywords: string[];
    secondaryKeywords: string[];
  };
  content: {
    html: string;
    metaTitle: string;
    metaDescription: string;
    summary: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      companyDescription, 
      targetAudience, 
      companyUrl,
      currentContent,
      competitorAnalysis 
    } = await req.json();

    if (!query || !companyDescription || !competitorAnalysis) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const userId = getUserIdFromRequest(req);
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

    console.log('Generating content for query:', query);

    // Step 1: Generate the guideline
    const guidelinePrompt = `You are an expert SEO strategist. Analyze the competitive landscape for this search query and create a detailed content guideline.

Query: "${query}"
Company: ${companyDescription}
Target Audience: ${targetAudience}
Company URL: ${companyUrl}

Current Company Content Summary:
${currentContent || 'No existing content found for this topic.'}

Competitor Analysis:
${JSON.stringify(competitorAnalysis, null, 2)}

Create a content guideline that identifies:
1. Gaps in the company's current content that competitors are filling
2. Strengths of top competitors that we need to match or exceed
3. Unique angles the company can take to differentiate
4. Specific recommendations for content structure and depth

Return a JSON object with this exact structure:
{
  "title": "Guideline title for this query",
  "currentGaps": ["List of gaps in current content", "..."],
  "competitorStrengths": ["What competitors do well", "..."],
  "recommendedApproach": "Overall strategy recommendation",
  "keyDifferentiators": ["Unique angles to pursue", "..."],
  "targetWordCount": 1500,
  "primaryKeywords": ["main keywords to target"],
  "secondaryKeywords": ["supporting keywords"]
}

Return ONLY valid JSON, no markdown.`;

    const guidelineResponse = await fetch('https://api.llama.com/compat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: [
          { role: 'user', content: guidelinePrompt },
        ],
        temperature: 0.5,
        max_tokens: 2048,
      }),
    });

    if (!guidelineResponse.ok) {
      const errorText = await guidelineResponse.text();
      console.error('Llama API error (guideline):', guidelineResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Guideline generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guidelineData = await guidelineResponse.json();
    let guidelineText = guidelineData.choices?.[0]?.message?.content || '';
    guidelineText = guidelineText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let guideline;
    try {
      guideline = JSON.parse(guidelineText);
    } catch (e) {
      console.error('Failed to parse guideline JSON:', e);
      guideline = {
        title: `Content Strategy for "${query}"`,
        currentGaps: ['Content depth needs improvement', 'Missing key topics covered by competitors'],
        competitorStrengths: ['Comprehensive coverage', 'Strong keyword optimization'],
        recommendedApproach: 'Create authoritative, in-depth content that addresses user intent comprehensively.',
        keyDifferentiators: ['Unique industry expertise', 'Practical actionable advice'],
        targetWordCount: 1500,
        primaryKeywords: [query],
        secondaryKeywords: [],
      };
    }

    // Step 2: Generate the content based on the guideline
    const contentPrompt = `You are an expert SEO content writer. Create high-quality HTML content for this search query based on the strategic guideline provided.

Query: "${query}"
Company: ${companyDescription}
Target Audience: ${targetAudience}
Website: ${companyUrl}

STRATEGIC GUIDELINE:
${JSON.stringify(guideline, null, 2)}

Create content that:
1. Directly addresses the gaps identified in the guideline
2. Matches or exceeds competitor strengths
3. Incorporates the key differentiators for unique value
4. Targets approximately ${guideline.targetWordCount || 1500} words
5. Naturally includes primary keywords: ${(guideline.primaryKeywords || [query]).join(', ')}
6. Also incorporates secondary keywords where natural

Output a JSON object with this structure:
{
  "html": "<!DOCTYPE html>...(complete HTML article)",
  "metaTitle": "SEO-optimized page title (under 60 chars)",
  "metaDescription": "Compelling meta description (under 160 chars)",
  "summary": "Brief 2-sentence summary of what this content provides that competitors don't"
}

Return ONLY valid JSON, no markdown.`;

    const contentResponse = await fetch('https://api.llama.com/compat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: [
          { role: 'user', content: contentPrompt },
        ],
        temperature: 0.6,
        max_tokens: 6000,
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('Llama API error (content):', contentResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Content generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentData = await contentResponse.json();
    let contentText = contentData.choices?.[0]?.message?.content || '';
    contentText = contentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let content;
    try {
      content = JSON.parse(contentText);
    } catch (e) {
      console.error('Failed to parse content JSON, using raw HTML:', e);
      // Try to extract HTML if it's not valid JSON
      const htmlMatch = contentText.match(/<!DOCTYPE html>[\s\S]*/i);
      content = {
        html: htmlMatch ? htmlMatch[0] : contentText,
        metaTitle: `${query} | ${companyUrl}`,
        metaDescription: `Expert guide on ${query} from ${companyUrl}`,
        summary: 'Comprehensive content created to fill competitive gaps and provide unique value.',
      };
    }

    // Clean up HTML if wrapped in code blocks
    if (content.html) {
      content.html = content.html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    }

    console.log('Generated content for query:', query, '- HTML length:', content.html?.length || 0);

    // Record usage after successful operation
    if (userId) {
      await recordUsageEvent(userId, 'generate-requests', 1);
    }

    const result: QueryContentResult = {
      query,
      guideline,
      content,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-generate-query:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
