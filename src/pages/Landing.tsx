import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Search, 
  BarChart3, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Brain,
  Globe,
  FileCode,
  Play
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enableDemoMode } = useDemo();

  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/auth");
    }
  };

  const handleTryDemo = () => {
    navigate("/auth?demo=true");
  };

  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Smart Website Scraping",
      description: "Our AI agent crawls your website and extracts key content, understanding your business context automatically."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Query Generation",
      description: "Generate high-intent search queries your target audience uses, based on semantic understanding of your content."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Competitor Analysis",
      description: "Analyze top-ranking pages for each query, identifying content gaps and opportunities in your niche."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Multi-LLM Comparison",
      description: "See how different AI models (GPT-4, Gemini, Perplexity) respond to your target queries."
    },
    {
      icon: <FileCode className="w-6 h-6" />,
      title: "Content Generation",
      description: "Auto-generate SEO-optimized HTML content with clear guidelines on what to improve."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Agentic Pipeline",
      description: "Watch our AI agent work through each step in real-time with full transparency."
    }
  ];

  const benefits = [
    "Discover untapped keyword opportunities",
    "Understand competitor content strategies",
    "Generate ready-to-use optimized content",
    "Compare LLM outputs for your queries",
    "Get actionable SEO recommendations",
    "Save hours of manual research"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
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
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/app")}>
                Go to App
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button onClick={handleGetStarted}>
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered SEO Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-teal bg-clip-text text-transparent">
              Discover Content Gaps
            </span>
            <br />
            <span className="text-foreground">& Outrank Competitors</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Our agentic AI scrapes your website, analyzes competitor content, and generates 
            SEO-optimized content to help you rank for high-value keywords.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              Start Analyzing
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleTryDemo}
              className="text-lg px-8 py-6"
            >
              <Play className="mr-2 w-5 h-5" />
              Try Demo
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • <span className="text-primary font-medium">4 free analyses per account</span>
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for SEO Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive pipeline handles the entire SEO research and content creation workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI agent follows a systematic approach to find and fill your content gaps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: 1, title: "Enter URL", desc: "Paste your website URL" },
              { step: 2, title: "Scrape & Analyze", desc: "AI extracts key content" },
              { step: 3, title: "Generate Queries", desc: "Find target keywords" },
              { step: 4, title: "Analyze Competitors", desc: "Study top-ranking pages" },
              { step: 5, title: "Get Content", desc: "Receive optimized HTML" },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-card rounded-xl border border-border p-4 text-center h-full">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {item.step < 5 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-teal/5">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose SEO Gap Analyzer?
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <Button size="lg" onClick={handleTryDemo} className="text-lg px-8 py-6">
                <Play className="mr-2 w-5 h-5" />
                Try Demo Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Outrank Your Competitors?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your SEO analysis today and discover the content opportunities you've been missing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-semibold">SEO Gap Analyzer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SEO Gap Analyzer. Powered by AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
