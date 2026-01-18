import { ExternalLink, TrendingUp } from "lucide-react";

interface CompetitorCardProps {
  url: string;
  title: string;
  position: number;
  insights: string[];
}

export function CompetitorCard({ url, title, position, insights }: CompetitorCardProps) {
  return (
    <div className="bg-secondary/50 rounded-lg p-4 border border-border hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {position}
            </span>
            <h4 className="font-medium truncate">{title}</h4>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
          >
            {url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      </div>
      
      {insights.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-accent font-medium mb-2">
            <TrendingUp className="w-3 h-3" />
            Key Insights
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
