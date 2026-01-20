import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gift, Lock } from 'lucide-react';

interface DefaultLLMCardProps {
  isActive: boolean;
  remainingUses: number;
  hasOwnOpenAIKey: boolean;
}

export function DefaultLLMCard({ isActive, remainingUses, hasOwnOpenAIKey }: DefaultLLMCardProps) {
  const isDeactivated = !isActive || remainingUses <= 0 || hasOwnOpenAIKey;
  const deactivationReason = hasOwnOpenAIKey 
    ? "Your OpenAI key is being used instead" 
    : remainingUses <= 0 
      ? "Free trial exhausted" 
      : "";

  return (
    <Card className={isDeactivated 
      ? 'border-muted bg-muted/30 opacity-75' 
      : 'border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5'
    }>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              isDeactivated ? 'bg-muted' : 'bg-primary/20'
            }`}>
              {isDeactivated ? (
                <Lock className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Default LLM
                {!isDeactivated && (
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px]">
                    <Gift className="w-3 h-3 mr-1" />
                    FREE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Powered by GPT-5 Mini
              </CardDescription>
            </div>
          </div>
          {isDeactivated ? (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Inactive
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isDeactivated ? (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {deactivationReason}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <span className="text-sm font-medium">Remaining Free Analyses</span>
              <span className="text-2xl font-bold text-primary">{remainingUses}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              We provide GPT-5 Mini for your first {remainingUses} analyses. Add your own OpenAI API key to 
              continue using the platform after your free trial.
            </p>
          </>
        )}

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Model:</span>
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">gpt-5-mini</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
