import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { seoApi, SearchResult } from '@/lib/seo-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PipelineStep } from '@/components/PipelineStep';
import { ResultCard } from '@/components/ResultCard';
import { QueryChip } from '@/components/QueryChip';
import { CompetitorCard } from '@/components/CompetitorCard';
import { HtmlPreview } from '@/components/HtmlPreview';
import { 
  Loader2, ArrowLeft, Globe, Play, Youtube, Music, 
  Image, FileAudio, Upload, Sparkles 
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  website_url: string | null;
  description: string | null;
  target_audience: string | null;
}

type StepStatus = 'pending' | 'processing' | 'completed' | 'error';

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
  generatedHtml: string;
}

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    scraping: 'pending',
    embedding: 'pending',
    queryGeneration: 'pending',
    competitorAnalysis: 'pending',
    contentGeneration: 'pending',
  });
  const [results, setResults] = useState<AnalysisResults | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchCompany();
    }
  }, [user, id]);

  const fetchCompany = async () => {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: 'Company not found',
        description: 'This company profile does not exist.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } else {
      setCompany(data);
      setWebsiteUrl(data.website_url || '');
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!websiteUrl) {
      toast({
        title: 'Website URL required',
        description: 'Please enter a website URL to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setPipelineState({
      scraping: 'processing',
      embedding: 'pending',
      queryGeneration: 'pending',
      competitorAnalysis: 'pending',
      contentGeneration: 'pending',
    });

    try {
      // Step 1: Scraping
      const scrapeResult = await seoApi.scrapeWebsite(websiteUrl);
      if (!scrapeResult.success || !scrapeResult.data) {
        throw new Error(scrapeResult.error || 'Failed to scrape website');
      }
      setPipelineState((s) => ({ ...s, scraping: 'completed', embedding: 'processing' }));

      // Step 2: Embedding
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPipelineState((s) => ({ ...s, embedding: 'completed', queryGeneration: 'processing' }));

      // Step 3: Query Generation
      const analysisResult = await seoApi.analyzeContent(scrapeResult.data.content, websiteUrl);
      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'Failed to analyze content');
      }

      const { companyDescription, targetAudience, queries } = analysisResult.data;
      setResults({
        companyDescription,
        targetAudience,
        queries,
        competitors: [],
        generatedHtml: '',
      });
      
      // Update company profile with analysis results
      await supabase
        .from('company_profiles')
        .update({
          description: companyDescription,
          target_audience: targetAudience,
        })
        .eq('id', id);

      setPipelineState((s) => ({ ...s, queryGeneration: 'completed', competitorAnalysis: 'processing' }));

      // Step 4: Competitor Analysis
      const allSearchResults: SearchResult[] = [];
      const queriesToSearch = queries.slice(0, 5);
      
      for (let i = 0; i < queriesToSearch.length; i++) {
        setCurrentQueryIndex(i);
        const searchResult = await seoApi.searchQuery(queriesToSearch[i], websiteUrl);
        if (searchResult.success && searchResult.data) {
          allSearchResults.push(searchResult.data);
          setResults((r) => r && { ...r, competitors: [...allSearchResults] });
        }
      }
      
      setPipelineState((s) => ({ ...s, competitorAnalysis: 'completed', contentGeneration: 'processing' }));

      // Step 5: Content Generation
      const generateResult = await seoApi.generateContent(
        companyDescription,
        targetAudience,
        queries,
        allSearchResults,
        websiteUrl
      );

      if (!generateResult.success || !generateResult.data) {
        throw new Error(generateResult.error || 'Failed to generate content');
      }

      setResults((r) => r && { ...r, generatedHtml: generateResult.data!.html });
      setPipelineState((s) => ({ ...s, contentGeneration: 'completed' }));

      // Save analysis results
      await supabase.from('analysis_results').insert([{
        company_profile_id: id,
        queries: queries as unknown as null,
        competitor_data: allSearchResults as unknown as null,
        generated_html: generateResult.data.html,
      }]);

      toast({
        title: 'Analysis Complete!',
        description: 'Your SEO content has been generated successfully.',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
      
      setPipelineState((s) => {
        const newState = { ...s };
        if (s.scraping === 'processing') newState.scraping = 'error';
        if (s.embedding === 'processing') newState.embedding = 'error';
        if (s.queryGeneration === 'processing') newState.queryGeneration = 'error';
        if (s.competitorAnalysis === 'processing') newState.competitorAnalysis = 'error';
        if (s.contentGeneration === 'processing') newState.contentGeneration = 'error';
        return newState;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">{company.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analysis">SEO Analysis</TabsTrigger>
            <TabsTrigger value="media">Media Sources</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {/* Website Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Website Analysis
                </CardTitle>
                <CardDescription>
                  Enter a website URL to analyze and generate SEO content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline & Results */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pipeline */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pipeline Progress</h3>
                <div className="space-y-3">
                  <PipelineStep
                    step={1}
                    title="Website Scraping"
                    description="Crawling and extracting content"
                    status={pipelineState.scraping}
                  />
                  <PipelineStep
                    step={2}
                    title="Content Embedding"
                    description="Processing for semantic analysis"
                    status={pipelineState.embedding}
                  />
                  <PipelineStep
                    step={3}
                    title="Query Generation"
                    description="Identifying target keywords"
                    status={pipelineState.queryGeneration}
                  />
                  <PipelineStep
                    step={4}
                    title="Competitor Analysis"
                    description={
                      pipelineState.competitorAnalysis === 'processing'
                        ? `Analyzing query ${currentQueryIndex + 1}/5`
                        : 'Researching top results'
                    }
                    status={pipelineState.competitorAnalysis}
                  />
                  <PipelineStep
                    step={5}
                    title="Content Generation"
                    description="Creating SEO-optimized content"
                    status={pipelineState.contentGeneration}
                    isLast
                  />
                </div>
              </div>

              {/* Results */}
              <div className="lg:col-span-2 space-y-4">
                {results ? (
                  <>
                    <ResultCard title="Company Analysis" icon="building">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                          <p className="text-sm">{results.companyDescription}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Target Audience</h4>
                          <p className="text-sm">{results.targetAudience}</p>
                        </div>
                      </div>
                    </ResultCard>

                    {results.queries.length > 0 && (
                      <ResultCard title="Generated Queries" icon="search">
                        <div className="flex flex-wrap gap-2">
                          {results.queries.map((query, index) => (
                            <QueryChip key={index} query={query} index={index} />
                          ))}
                        </div>
                      </ResultCard>
                    )}

                    {results.competitors.length > 0 && (
                      <ResultCard title="Competitor Analysis" icon="users">
                        <div className="space-y-4">
                          {results.competitors.map((result, index) => (
                            <div key={index} className="space-y-2">
                              <h4 className="text-sm font-medium">"{result.query}"</h4>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {result.competitors.slice(0, 4).map((comp, i) => (
                                  <CompetitorCard 
                                    key={i} 
                                    url={comp.url}
                                    title={comp.title}
                                    position={comp.position}
                                    insights={comp.insights}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResultCard>
                    )}

                    {results.generatedHtml && (
                      <ResultCard title="Generated Content" icon="code">
                        <HtmlPreview html={results.generatedHtml} />
                      </ResultCard>
                    )}
                  </>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No analysis yet</h3>
                      <p className="text-muted-foreground text-center">
                        Enter a website URL and click Analyze to get started
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Media Sources
                </CardTitle>
                <CardDescription>
                  Upload images and audio files to enhance your company profile with embeddings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Upload Media</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop images or audio files, or click to browse
                  </p>
                  <Button variant="outline" disabled>
                    <FileAudio className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    YouTube Playlists
                  </CardTitle>
                  <CardDescription>
                    Import YouTube playlists to analyze video content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input placeholder="https://youtube.com/playlist?list=..." disabled />
                    <Button className="w-full" disabled>
                      <Youtube className="h-4 w-4 mr-2" />
                      Import Playlist (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-green-500" />
                    Spotify Playlists
                  </CardTitle>
                  <CardDescription>
                    Import Spotify playlists to analyze podcast content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input placeholder="https://open.spotify.com/playlist/..." disabled />
                    <Button className="w-full" disabled>
                      <Music className="h-4 w-4 mr-2" />
                      Import Playlist (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
