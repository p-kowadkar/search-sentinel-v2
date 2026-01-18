import { Globe, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  url: string;
  onChange: (url: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function UrlInput({ url, onChange, onSubmit, isLoading }: UrlInputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-xl rounded-2xl" />
      <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Enter Your Website URL</h2>
            <p className="text-sm text-muted-foreground">We'll analyze your site and find content opportunities</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <Input
              type="url"
              value={url}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://your-website.com"
              className="h-12 pl-4 pr-4 text-base"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-12 px-6 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
