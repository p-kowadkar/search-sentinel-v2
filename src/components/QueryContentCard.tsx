import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Code, Copy, Check, ExternalLink } from "lucide-react";
import { QueryContentResult } from "@/lib/seo-api";
import { ContentGuidelineCard } from "./ContentGuideline";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface QueryContentCardProps {
  result: QueryContentResult;
  index: number;
}

export function QueryContentCard({ result, index }: QueryContentCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content.html);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "HTML content copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {index + 1}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{result.query}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {result.content.summary}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Meta Info */}
          <div className="p-4 bg-muted/20 border-b border-border">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground">Meta Title</span>
                <p className="text-sm font-medium text-foreground">{result.content.metaTitle}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Meta Description</span>
                <p className="text-sm text-foreground">{result.content.metaDescription}</p>
              </div>
            </div>
          </div>

          {/* Guideline */}
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Content Strategy Guideline
            </h4>
            <ContentGuidelineCard guideline={result.guideline} />
          </div>

          {/* Content Preview/Code */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Generated Content
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs"
                >
                  {showPreview ? (
                    <>
                      <Code className="w-3 h-3 mr-1" /> View Code
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 mr-1" /> Preview
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" /> Copy HTML
                    </>
                  )}
                </Button>
              </div>
            </div>

            {showPreview ? (
              <div className="bg-white rounded-lg border border-border overflow-hidden">
                <iframe
                  srcDoc={result.content.html}
                  className="w-full h-[400px] border-0"
                  title={`Preview for ${result.query}`}
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs max-h-[400px] overflow-y-auto">
                  <code className="text-foreground">{result.content.html}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
