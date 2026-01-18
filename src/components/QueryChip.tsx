import { cn } from "@/lib/utils";

interface QueryChipProps {
  query: string;
  index: number;
  isActive?: boolean;
  isCompleted?: boolean;
}

export function QueryChip({ query, index, isActive, isCompleted }: QueryChipProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border",
        isActive && "bg-gradient-primary text-primary-foreground border-transparent animate-pulse-glow",
        isCompleted && "bg-success/10 text-success border-success/30",
        !isActive && !isCompleted && "bg-muted text-muted-foreground border-border"
      )}
    >
      <span className="opacity-60 mr-2">#{index + 1}</span>
      {query}
    </div>
  );
}
