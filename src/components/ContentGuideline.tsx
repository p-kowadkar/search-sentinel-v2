import { Target, TrendingUp, Lightbulb, AlertCircle, Tag, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { ContentGuideline as GuidelineType } from "@/lib/seo-api";

interface ContentGuidelineProps {
  guideline: GuidelineType;
}

export function ContentGuidelineCard({ guideline }: ContentGuidelineProps) {
  return (
    <div className="bg-card/50 rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{guideline.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Target: ~{guideline.targetWordCount} words
          </p>
        </div>
      </div>

      {/* Pros & Cons Analysis */}
      {guideline.contentAnalysis && (
        <div className="bg-gradient-to-r from-emerald-500/5 to-rose-500/5 rounded-lg p-4 border border-border">
          <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Current vs Generated Content Analysis
          </h5>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Current Content Pros */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
                <ThumbsUp className="w-4 h-4" />
                Current Content Pros
              </div>
              <ul className="space-y-1">
                {guideline.contentAnalysis.currentContentPros.map((pro, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-500/60 mt-1">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Content Cons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-rose-500">
                <ThumbsDown className="w-4 h-4" />
                Current Content Cons
              </div>
              <ul className="space-y-1">
                {guideline.contentAnalysis.currentContentCons.map((con, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-rose-500/60 mt-1">−</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generated Content Improvements */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="w-4 h-4" />
                Generated Improvements
              </div>
              <ul className="space-y-1">
                {guideline.contentAnalysis.generatedContentImprovements.map((improvement, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary/60 mt-1">✓</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Gaps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="w-4 h-4" />
            Content Gaps to Fill
          </div>
          <ul className="space-y-1">
            {guideline.currentGaps.map((gap, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-destructive/60 mt-1">•</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>

        {/* Competitor Strengths */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
            <TrendingUp className="w-4 h-4" />
            Competitor Strengths
          </div>
          <ul className="space-y-1">
            {guideline.competitorStrengths.map((strength, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-amber-500/60 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Approach */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
          <Lightbulb className="w-4 h-4" />
          Recommended Approach
        </div>
        <p className="text-sm text-foreground">{guideline.recommendedApproach}</p>
      </div>

      {/* Key Differentiators */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-teal">
          <Lightbulb className="w-4 h-4" />
          Your Key Differentiators
        </div>
        <div className="flex flex-wrap gap-2">
          {guideline.keyDifferentiators.map((diff, i) => (
            <span
              key={i}
              className="px-3 py-1 text-xs rounded-full bg-teal/10 text-teal border border-teal/20"
            >
              {diff}
            </span>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Primary:</span>
          <div className="flex gap-1">
            {guideline.primaryKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">
                {kw}
              </span>
            ))}
          </div>
        </div>
        {guideline.secondaryKeywords.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Secondary:</span>
            <div className="flex gap-1 flex-wrap">
              {guideline.secondaryKeywords.slice(0, 5).map((kw, i) => (
                <span key={i} className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}