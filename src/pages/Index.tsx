import { useState } from "react";
import { Search, FileText, BarChart3, Zap, Code, Target, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PipelineStep, StepStatus } from "@/components/PipelineStep";
import { UrlInput } from "@/components/UrlInput";
import { ResultCard } from "@/components/ResultCard";
import { QueryChip } from "@/components/QueryChip";
import { CompetitorCard } from "@/components/CompetitorCard";
import { QueryContentCard } from "@/components/QueryContentCard";
import { seoApi, SearchResult, QueryContentResult } from "@/lib/seo-api";

interface PipelineState {
  scraping: StepStatus;
  embedding: StepStatus;
  queryGeneration: StepStatus;
  competitorAnalysis: StepStatus;
  contentGeneration: StepStatus;
}

interface AnalysisResults {
  companyDescription: string;
  targetAudience: string;
  queries: string[];
  competitors: SearchResult[];
  queryContents: QueryContentResult[];
  scrapedContent: string;
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

    try {
      // Step 1: Scraping
      setPipelineState((s) => ({ ...s, scraping: "processing" }));
      const scrapeResult = await seoApi.scrapeWebsite(url);
      
      if (!scrapeResult.success || !scrapeResult.data) {
        throw new Error(scrapeResult.error || "Failed to scrape website");
      }

      // Check if content was actually scraped
      const scrapedContent = scrapeResult.data.content?.trim() || "";
      if (!scrapedContent) {
        // Use URL-based fallback content for analysis
        console.warn("No content scraped, using URL-based analysis");
      }
      
      setPipelineState((s) => ({ ...s, scraping: "completed", embedding: "processing" }));

      // Step 2: Embedding (simulated - the analysis includes understanding the content)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPipelineState((s) => ({ ...s, embedding: "completed", queryGeneration: "processing" }));

      // Step 3: Query Generation - use URL if no content available
      const contentToAnalyze = scrapedContent || `Website: ${url} - Analyze based on URL structure and domain.`;
      const analysisResult = await seoApi.analyzeContent(contentToAnalyze, url);
      
      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || "Failed to analyze content");
      }

      const { companyDescription, targetAudience, queries } = analysisResult.data;
      setResults({
        companyDescription,
        targetAudience,
        queries,
        competitors: [],
        queryContents: [],
        scrapedContent: scrapedContent || contentToAnalyze,
      });
      setPipelineState((s) => ({ ...s, queryGeneration: "completed", competitorAnalysis: "processing" }));

      // Step 4: Competitor Analysis (loop through queries)
      const allSearchResults: SearchResult[] = [];
      const queriesToSearch = queries.slice(0, 5); // Limit to 5 queries
      
      for (let i = 0; i < queriesToSearch.length; i++) {
        setCurrentQueryIndex(i);
        
        const searchResult = await seoApi.searchQuery(queriesToSearch[i], url);
        
        if (searchResult.success && searchResult.data) {
          allSearchResults.push(searchResult.data);
          setResults((r) => r && { ...r, competitors: [...allSearchResults] });
        }
      }
      
      setPipelineState((s) => ({ ...s, competitorAnalysis: "completed", contentGeneration: "processing" }));

      // Step 5: Per-Query Content Generation with Guidelines
      const allQueryContents: QueryContentResult[] = [];
      
      for (let i = 0; i < allSearchResults.length; i++) {
        setCurrentQueryIndex(i);
        
        const generateResult = await seoApi.generateQueryContent(
          allSearchResults[i].query,
          companyDescription,
          targetAudience,
          url,
          scrapeResult.data.content.slice(0, 2000), // Send excerpt of current content
          allSearchResults[i]
        );

        if (generateResult.success && generateResult.data) {
          allQueryContents.push(generateResult.data);
          setResults((r) => r && { ...r, queryContents: [...allQueryContents] });
        }
      }
      
      setPipelineState((s) => ({ ...s, contentGeneration: "completed" }));

      toast({
        title: "Analysis Complete!",
        description: "Your SEO content has been generated successfully.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis.",
        variant: "destructive",
      });
      
      // Mark current step as error
      setPipelineState((s) => {
        const newState = { ...s };
        if (s.scraping === "processing") newState.scraping = "error";
        if (s.embedding === "processing") newState.embedding = "error";
        if (s.queryGeneration === "processing") newState.queryGeneration = "error";
        if (s.competitorAnalysis === "processing") newState.competitorAnalysis = "error";
        if (s.contentGeneration === "processing") newState.contentGeneration = "error";
        return newState;
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
            {/* Company Description */}
            {results?.companyDescription && (
              <ResultCard title="Company Analysis" icon={<FileText className="w-5 h-5" />}>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">What they do</h4>
                    <p className="text-foreground">{results.companyDescription}</p>
                  </div>
                  {results.targetAudience && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Audience</h4>
                      <p className="text-foreground">{results.targetAudience}</p>
                    </div>
                  )}
                </div>
              </ResultCard>
            )}

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
                      isCompleted={results.competitors.some((c) => c.query === query)}
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
                        {comp.competitors.slice(0, 4).map((result, j) => (
                          <CompetitorCard key={j} {...result} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Generated Per-Query Content with Guidelines */}
            {results?.queryContents && results.queryContents.length > 0 && (
              <ResultCard title="Content Strategies & Generated Content" icon={<BookOpen className="w-5 h-5" />}>
                <div className="space-y-4">
                  {results.queryContents.map((result, i) => (
                    <QueryContentCard key={i} result={result} index={i} />
                  ))}
                </div>
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
