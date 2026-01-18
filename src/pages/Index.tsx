import { useState } from "react";
import { Search, FileText, BarChart3, Zap, Code, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PipelineStep, StepStatus } from "@/components/PipelineStep";
import { UrlInput } from "@/components/UrlInput";
import { ResultCard } from "@/components/ResultCard";
import { QueryChip } from "@/components/QueryChip";
import { CompetitorCard } from "@/components/CompetitorCard";
import { HtmlPreview } from "@/components/HtmlPreview";

interface PipelineState {
  scraping: StepStatus;
  embedding: StepStatus;
  queryGeneration: StepStatus;
  competitorAnalysis: StepStatus;
  contentGeneration: StepStatus;
}

interface AnalysisResults {
  companyDescription: string;
  queries: string[];
  competitors: Array<{
    query: string;
    results: Array<{
      url: string;
      title: string;
      position: number;
      insights: string[];
    }>;
  }>;
  generatedHtml: string;
}

export default function Index() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentQueryIndex, setCurrentQueryIndex] = useState(-1);
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    scraping: "pending",
    embedding: "pending",
    queryGeneration: "pending",
    competitorAnalysis: "pending",
    contentGeneration: "pending",
  });
  const [results, setResults] = useState<AnalysisResults | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setCurrentQueryIndex(-1);

    // Reset pipeline
    setPipelineState({
      scraping: "pending",
      embedding: "pending",
      queryGeneration: "pending",
      competitorAnalysis: "pending",
      contentGeneration: "pending",
    });

    // Simulate the agentic loop with demo data
    // In production, this would call backend APIs
    try {
      // Step 1: Scraping
      setPipelineState((s) => ({ ...s, scraping: "processing" }));
      await simulateDelay(2000);
      setPipelineState((s) => ({ ...s, scraping: "completed", embedding: "processing" }));

      // Step 2: Embedding
      await simulateDelay(1500);
      setPipelineState((s) => ({ ...s, embedding: "completed", queryGeneration: "processing" }));

      // Step 3: Query Generation
      await simulateDelay(2000);
      const queries = generateDemoQueries(url);
      setResults({ companyDescription: "", queries, competitors: [], generatedHtml: "" });
      setPipelineState((s) => ({ ...s, queryGeneration: "completed", competitorAnalysis: "processing" }));

      // Step 4: Competitor Analysis (loop through queries)
      const competitors: AnalysisResults["competitors"] = [];
      for (let i = 0; i < Math.min(queries.length, 5); i++) {
        setCurrentQueryIndex(i);
        await simulateDelay(1500);
        competitors.push({
          query: queries[i],
          results: generateDemoCompetitors(queries[i]),
        });
        setResults((r) => r && { ...r, competitors });
      }
      setPipelineState((s) => ({ ...s, competitorAnalysis: "completed", contentGeneration: "processing" }));

      // Step 5: Content Generation
      await simulateDelay(2500);
      const generatedHtml = generateDemoHtml(url, queries, competitors);
      setResults((r) => r && { ...r, generatedHtml });
      setPipelineState((s) => ({ ...s, contentGeneration: "completed" }));

      toast({
        title: "Analysis Complete!",
        description: "Your SEO content has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "An error occurred during analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentQueryIndex(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">SEO Gap Analyzer</h1>
              <p className="text-xs text-muted-foreground">Agentic Content Intelligence</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-teal bg-clip-text text-transparent">
            Discover Content Gaps & Outrank Competitors
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI agent scrapes your website, analyzes search results, and generates
            optimized content to help you rank for valuable keywords.
          </p>
        </div>

        {/* URL Input */}
        <div className="mb-12">
          <UrlInput
            url={url}
            onChange={setUrl}
            onSubmit={handleAnalyze}
            isLoading={isAnalyzing}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pipeline Visualization */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Agent Pipeline
              </h3>
              <div className="space-y-0">
                <PipelineStep
                  step={1}
                  title="Website Scraping"
                  description="Crawling and extracting content from your website"
                  status={pipelineState.scraping}
                />
                <PipelineStep
                  step={2}
                  title="Vector Embedding"
                  description="Converting content to semantic embeddings"
                  status={pipelineState.embedding}
                />
                <PipelineStep
                  step={3}
                  title="Query Generation"
                  description="AI generates targeted search queries"
                  status={pipelineState.queryGeneration}
                />
                <PipelineStep
                  step={4}
                  title="Competitor Analysis"
                  description="Analyzing top-ranking competitor pages"
                  status={pipelineState.competitorAnalysis}
                />
                <PipelineStep
                  step={5}
                  title="Content Generation"
                  description="Creating optimized HTML content"
                  status={pipelineState.contentGeneration}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generated Queries */}
            {results?.queries && results.queries.length > 0 && (
              <ResultCard title="Generated Search Queries" icon={<Search className="w-5 h-5" />}>
                <div className="flex flex-wrap gap-2">
                  {results.queries.map((query, i) => (
                    <QueryChip
                      key={i}
                      query={query}
                      index={i}
                      isActive={currentQueryIndex === i}
                      isCompleted={
                        results.competitors.some((c) => c.query === query)
                      }
                    />
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Competitor Analysis */}
            {results?.competitors && results.competitors.length > 0 && (
              <ResultCard title="Competitor Analysis" icon={<BarChart3 className="w-5 h-5" />}>
                <div className="space-y-6">
                  {results.competitors.map((comp, i) => (
                    <div key={i}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Query: <span className="text-foreground">"{comp.query}"</span>
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {comp.results.slice(0, 4).map((result, j) => (
                          <CompetitorCard key={j} {...result} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Generated HTML Content */}
            {results?.generatedHtml && (
              <ResultCard title="Generated SEO Content" icon={<Code className="w-5 h-5" />}>
                <HtmlPreview html={results.generatedHtml} />
              </ResultCard>
            )}

            {/* Empty State */}
            {!results && !isAnalyzing && (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enter your website URL above to start the AI-powered analysis and discover
                  content opportunities to improve your search rankings.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper functions
function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateDemoQueries(url: string): string[] {
  const domain = url.replace(/https?:\/\//, "").replace(/\/$/, "").split("/")[0];
  return [
    `best ${domain.split(".")[0]} alternatives`,
    `${domain.split(".")[0]} vs competitors`,
    `how to use ${domain.split(".")[0]}`,
    `${domain.split(".")[0]} pricing comparison`,
    `${domain.split(".")[0]} features guide`,
    `${domain.split(".")[0]} tutorials`,
    `${domain.split(".")[0]} reviews 2024`,
    `is ${domain.split(".")[0]} worth it`,
    `${domain.split(".")[0]} integrations`,
    `${domain.split(".")[0]} for beginners`,
  ];
}

function generateDemoCompetitors(query: string): Array<{
  url: string;
  title: string;
  position: number;
  insights: string[];
}> {
  return [
    {
      url: "https://competitor1.com/blog/article",
      title: `Complete Guide: ${query}`,
      position: 1,
      insights: [
        "Strong keyword density in H1 and H2 tags",
        "Comprehensive 3000+ word content",
        "Multiple internal links to related topics",
      ],
    },
    {
      url: "https://competitor2.com/resources",
      title: `${query} - Expert Tips`,
      position: 2,
      insights: [
        "Rich media with infographics",
        "FAQ schema markup implemented",
        "High engagement metrics",
      ],
    },
    {
      url: "https://competitor3.com/guide",
      title: `The Ultimate ${query} Resource`,
      position: 3,
      insights: [
        "Updated content with fresh 2024 data",
        "Strong backlink profile",
        "Table of contents for easy navigation",
      ],
    },
    {
      url: "https://competitor4.com/article",
      title: `${query} Made Simple`,
      position: 4,
      insights: [
        "Video content embedded",
        "Clear call-to-action buttons",
        "Social proof with testimonials",
      ],
    },
  ];
}

function generateDemoHtml(
  url: string,
  queries: string[],
  competitors: AnalysisResults["competitors"]
): string {
  const domain = url.replace(/https?:\/\//, "").replace(/\/$/, "").split("/")[0];
  const brandName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Discover why ${brandName} is the leading solution for your needs. Compare features, pricing, and get expert tips.">
  <title>The Complete Guide to ${brandName} | Features, Pricing & Expert Tips</title>
</head>
<body>
  <article>
    <h1>The Complete Guide to ${brandName}</h1>
    
    <section>
      <h2>Why Choose ${brandName}?</h2>
      <p>${brandName} stands out from competitors with its innovative approach and user-friendly interface. Unlike other solutions, ${brandName} offers...</p>
    </section>

    <section>
      <h2>Key Features & Benefits</h2>
      <ul>
        <li><strong>Feature 1:</strong> Advanced capabilities that save time</li>
        <li><strong>Feature 2:</strong> Seamless integrations with your tools</li>
        <li><strong>Feature 3:</strong> Enterprise-grade security</li>
      </ul>
    </section>

    <section>
      <h2>How to Get Started</h2>
      <ol>
        <li>Sign up for a free account</li>
        <li>Complete the onboarding process</li>
        <li>Start using ${brandName} immediately</li>
      </ol>
    </section>

    <section>
      <h2>Frequently Asked Questions</h2>
      <h3>Is ${brandName} right for beginners?</h3>
      <p>Absolutely! ${brandName} is designed with beginners in mind...</p>
      
      <h3>What integrations are available?</h3>
      <p>${brandName} connects with over 100+ popular tools...</p>
    </section>
  </article>
</body>
</html>`;
}
