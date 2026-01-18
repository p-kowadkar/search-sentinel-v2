import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "processing" | "completed" | "error";

interface PipelineStepProps {
  step: number;
  title: string;
  description: string;
  status: StepStatus;
  isLast?: boolean;
}

export function PipelineStep({ step, title, description, status, isLast = false }: PipelineStepProps) {
  return (
    <div className="flex items-start gap-4 relative">
      {/* Step indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
            status === "completed" && "bg-success text-primary-foreground",
            status === "processing" && "bg-gradient-primary text-primary-foreground animate-pulse-glow",
            status === "pending" && "bg-muted text-muted-foreground border-2 border-border",
            status === "error" && "bg-destructive text-destructive-foreground"
          )}
        >
          {status === "completed" ? (
            <Check className="w-5 h-5" />
          ) : status === "processing" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>{step}</span>
          )}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div
            className={cn(
              "w-0.5 h-16 mt-2 transition-all duration-500",
              status === "completed" ? "bg-success" : "bg-border"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <h3
          className={cn(
            "font-semibold text-lg transition-colors",
            status === "processing" && "text-primary",
            status === "completed" && "text-success",
            status === "pending" && "text-muted-foreground",
            status === "error" && "text-destructive"
          )}
        >
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
