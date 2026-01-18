import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResultCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ResultCard({ title, icon, children, className }: ResultCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-6 shadow-md animate-slide-up",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
}
