import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

interface SquarespaceCredentials {
  apiKey: string;
  siteId: string;
  collectionId?: string;
}

async function publishToWordPress(
  title: string, 
  content: string, 
  credentials: WordPressCredentials
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Clean up the site URL
    let siteUrl = credentials.siteUrl.trim();
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }
    siteUrl = siteUrl.replace(/\/$/, '');

    // Create the auth header
    const auth = btoa(`${credentials.username}:${credentials.appPassword.replace(/\s/g, '')}`);

    const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        status: 'draft', // Create as draft for safety
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error:', response.status, errorText);
      
      if (response.status === 401) {
        return { success: false, error: 'Authentication failed. Check your username and application password.' };
      }
      if (response.status === 403) {
        return { success: false, error: 'Permission denied. Ensure your user has edit_posts capability.' };
      }
      
      return { success: false, error: `WordPress API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, postId: data.id.toString() };
  } catch (error: unknown) {
    console.error('WordPress publish error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to connect to WordPress' };
  }
}

async function publishToSquarespace(
  title: string,
  content: string,
  credentials: SquarespaceCredentials
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    // Squarespace Content API v1.0
    const baseUrl = 'https://api.squarespace.com/1.0';
    
    // First, get the blog collection if not specified
    let collectionId = credentials.collectionId;
    
    if (!collectionId) {
      // Try to find a blog collection
      const collectionsResponse = await fetch(
        `${baseUrl}/commerce/inventory`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Squarespace's content API is limited - we need to use their Blog API
      // For now, return an error suggesting they use the collection ID
      return { 
        success: false, 
        error: 'Please provide a Collection ID. Find it in: Pages → Blog → Settings → Blog ID' 
      };
    }

    // Note: Squarespace's public API for content creation is limited
    // The Blog Item creation requires specific API access
    const response = await fetch(
      `${baseUrl}/websites/${credentials.siteId}/pages/${collectionId}/blogs/items`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body: content,
          isDraft: true, // Create as draft for safety
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Squarespace API error:', response.status, errorText);
      
      if (response.status === 401) {
        return { success: false, error: 'Authentication failed. Check your API key.' };
      }
      if (response.status === 403) {
        return { success: false, error: 'Permission denied. Ensure your API key has write access.' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Site or collection not found. Check your Site ID and Collection ID.' };
      }
      
      // Squarespace API might not support direct blog post creation
      // Suggest alternative approach
      return { 
        success: false, 
        error: 'Squarespace API may not support direct content creation. Try copying the HTML and pasting into Squarespace editor.' 
      };
    }

    const data = await response.json();
    return { success: true, itemId: data.id };
  } catch (error: unknown) {
    console.error('Squarespace publish error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to connect to Squarespace' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, title, content, credentials } = await req.json();

    if (!platform || !title || !content || !credentials) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (platform) {
      case 'wordpress':
        result = await publishToWordPress(title, content, credentials as WordPressCredentials);
        break;
      case 'squarespace':
        result = await publishToSquarespace(title, content, credentials as SquarespaceCredentials);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unsupported platform: ${platform}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('CMS publish error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
