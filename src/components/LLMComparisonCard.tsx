import { useState } from "react";
import { Bot, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { LLMComparisonResult, LLMBenchmarkResult } from "@/lib/seo-api";
import { cn } from "@/lib/utils";

interface LLMComparisonCardProps {
  comparison: LLMComparisonResult;
  isLoading?: boolean;
}

const providerColors: Record<string, string> = {
  openai: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  google: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  perplexity: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  xai: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
};

const providerIcons: Record<string, string> = {
  openai: "🤖",
  google: "✨",
  perplexity: "🔍",
  xai: "🚀",
};

function LLMResultCard({ result }: { result: LLMBenchmarkResult }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorClass = providerColors[result.provider] || "from-gray-500/20 to-gray-500/5 border-gray-500/30";
  const icon = providerIcons[result.provider] || "🤖";

  return (
    <div className={cn(
      "rounded-lg border bg-gradient-to-br p-4 transition-all",
      colorClass
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h4 className="font-semibold text-foreground">{result.providerName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {result.available ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={cn(
                "text-xs",
                result.available ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {result.available ? "Response received" : result.error || "Unavailable"}
              </span>
            </div>
          </div>
        </div>
        
        {result.available && result.response && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md hover:bg-background/50 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Key Topics */}
      {result.keyTopics && result.keyTopics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.keyTopics.map((topic, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs rounded-full bg-background/50 text-foreground border border-border"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Response */}
      {isExpanded && result.response && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {result.response}
          </p>
        </div>
      )}

      {/* Preview when collapsed */}
      {!isExpanded && result.response && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {result.response}
        </p>
      )}
    </div>
  );
}

export function LLMComparisonCard({ comparison, isLoading }: LLMComparisonCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const availableCount = comparison.results.filter(r => r.available).length;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">LLM Comparison Results</h3>
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Querying LLMs...
                </span>
              ) : (
                `${availableCount} of ${comparison.results.length} models responded`
              )}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Query being compared */}
          <div className="bg-muted/30 rounded-lg p-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Query</span>
            <p className="text-sm font-medium text-foreground mt-1">{comparison.query}</p>
          </div>

          {/* LLM Results Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {comparison.results.map((result, i) => (
              <LLMResultCard key={result.provider} result={result} />
            ))}
          </div>

          {/* Correlation Analysis */}
          {comparison.correlationAnalysis && (
            <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Correlation Analysis
              </h4>
              <p className="text-sm text-muted-foreground">
                {comparison.correlationAnalysis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
