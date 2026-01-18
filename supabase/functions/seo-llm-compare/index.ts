import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LLMResult {
  provider: string;
  providerName: string;
  available: boolean;
  response?: string;
  keyTopics?: string[];
  error?: string;
}

async function queryOpenAI(query: string, apiKey: string): Promise<LLMResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant answering search queries. Provide concise, informative responses that would rank well for SEO. Include key topics and facts."
          },
          { role: "user", content: query }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "openai",
        providerName: "ChatGPT",
        available: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract key topics from response
    const keyTopics = extractKeyTopics(content);

    return {
      provider: "openai",
      providerName: "ChatGPT",
      available: true,
      response: content,
      keyTopics,
    };
  } catch (error) {
    return {
      provider: "openai",
      providerName: "ChatGPT",
      available: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function queryGemini(query: string, apiKey: string): Promise<LLMResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful assistant answering search queries. Provide concise, informative responses that would rank well for SEO. Include key topics and facts.\n\nQuery: ${query}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "google",
        providerName: "Gemini",
        available: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const keyTopics = extractKeyTopics(content);

    return {
      provider: "google",
      providerName: "Gemini",
      available: true,
      response: content,
      keyTopics,
    };
  } catch (error) {
    return {
      provider: "google",
      providerName: "Gemini",
      available: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function queryPerplexity(query: string, apiKey: string): Promise<LLMResult> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant answering search queries. Provide concise, informative responses with real-time web data. Include key topics and facts.",
          },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "perplexity",
        providerName: "Perplexity",
        available: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const keyTopics = extractKeyTopics(content);

    return {
      provider: "perplexity",
      providerName: "Perplexity",
      available: true,
      response: content,
      keyTopics,
    };
  } catch (error) {
    return {
      provider: "perplexity",
      providerName: "Perplexity",
      available: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function extractKeyTopics(content: string): string[] {
  // Simple extraction - find capitalized phrases and common topic patterns
  const topics: Set<string> = new Set();
  
  // Extract phrases in quotes
  const quotedMatches = content.match(/"([^"]+)"/g);
  quotedMatches?.slice(0, 3).forEach(m => topics.add(m.replace(/"/g, '')));
  
  // Extract bold/emphasized terms (markdown style)
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g);
  boldMatches?.slice(0, 3).forEach(m => topics.add(m.replace(/\*\*/g, '')));
  
  // Extract key phrases (capitalized multi-word terms)
  const capitalizedMatches = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  capitalizedMatches?.slice(0, 5).forEach(m => topics.add(m));
  
  return Array.from(topics).slice(0, 5);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const googleKey = Deno.env.get("GOOGLE_API_KEY");
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    // Run all available LLM queries in parallel
    const results: LLMResult[] = [];
    const promises: Promise<LLMResult>[] = [];

    if (openaiKey) {
      promises.push(queryOpenAI(query, openaiKey));
    } else {
      results.push({
        provider: "openai",
        providerName: "ChatGPT",
        available: false,
        error: "API key not configured",
      });
    }

    if (googleKey) {
      promises.push(queryGemini(query, googleKey));
    } else {
      results.push({
        provider: "google",
        providerName: "Gemini",
        available: false,
        error: "API key not configured",
      });
    }

    if (perplexityKey) {
      promises.push(queryPerplexity(query, perplexityKey));
    } else {
      results.push({
        provider: "perplexity",
        providerName: "Perplexity",
        available: false,
        error: "API key not configured",
      });
    }

    // Add xAI placeholder (disabled)
    results.push({
      provider: "xai",
      providerName: "Grok",
      available: false,
      error: "Currently disabled - API key unavailable",
    });

    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);

    // Sort by provider for consistent ordering
    const providerOrder = ["openai", "google", "perplexity", "xai"];
    results.sort((a, b) => providerOrder.indexOf(a.provider) - providerOrder.indexOf(b.provider));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          query,
          results,
          timestamp: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("LLM compare error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
