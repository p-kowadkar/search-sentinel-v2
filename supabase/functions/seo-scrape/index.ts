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
    // Parse JWT to get user ID (simplified - in production use proper JWT validation)
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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const userId = getUserIdFromRequest(req);
    if (userId) {
      const { allowed, remaining, error } = await checkApiRateLimit(userId, 'scrape-requests');
      
      if (!allowed) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error?.message || 'Rate limit exceeded. Please upgrade your plan.',
            remaining: 0
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': '0'
            } 
          }
        );
      }
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Crawling URL:', formattedUrl);

    // First, map the website to discover all URLs
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: 20,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    
    if (!mapResponse.ok) {
      console.error('Firecrawl map error:', mapData);
      return new Response(
        JSON.stringify({ success: false, error: mapData.error || 'Failed to map website' }),
        { status: mapResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urls = mapData.links?.slice(0, 10) || [formattedUrl];
    console.log(`Found ${urls.length} URLs to scrape`);

    // Scrape the main pages
    const scrapedContent: string[] = [];
    
    for (const pageUrl of urls.slice(0, 5)) {
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData.data?.markdown || scrapeData.markdown;
          if (markdown) {
            scrapedContent.push(`--- Page: ${pageUrl} ---\n${markdown}`);
          }
        }
      } catch (e) {
        console.error(`Error scraping ${pageUrl}:`, e);
      }
    }

    console.log(`Scraped ${scrapedContent.length} pages`);

    // Record usage after successful operation
    if (userId) {
      await recordUsageEvent(userId, 'scrape-requests', 1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: formattedUrl,
          pages: urls,
          content: scrapedContent.join('\n\n'),
          pageCount: scrapedContent.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
