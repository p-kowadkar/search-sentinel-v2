import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Check, ExternalLink } from 'lucide-react';
import { SCRAPER_PROVIDERS, ScraperProviderId, getScraperById } from '@/lib/llm-providers';

interface ScraperConfigCardProps {
  currentProvider?: ScraperProviderId;
  currentApiKey?: string;
  onSave: (provider: ScraperProviderId, apiKey?: string) => Promise<boolean>;
}

export function ScraperConfigCard({
  currentProvider = 'firecrawl_default',
  currentApiKey,
  onSave,
}: ScraperConfigCardProps) {
  const [selectedProvider, setSelectedProvider] = useState<ScraperProviderId>(currentProvider);
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const provider = getScraperById(selectedProvider);
  const hasChanges = selectedProvider !== currentProvider || apiKey !== (currentApiKey || '');

  useEffect(() => {
    if (selectedProvider === 'firecrawl_default') {
      setApiKey('');
    }
  }, [selectedProvider]);

  const handleSave = async () => {
    setSaving(true);
    const keyToSave = provider?.requiresKey ? apiKey.trim() : undefined;
    const success = await onSave(selectedProvider, keyToSave);
    if (success) {
      setShowKey(false);
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              🕷️ Web Scraping Configuration
            </CardTitle>
            <CardDescription>
              Choose your preferred web scraping provider. Only one can be active.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            <Check className="w-3 h-3 mr-1" />
            {getScraperById(currentProvider)?.name || 'Default'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Scraping Provider</Label>
          <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as ScraperProviderId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCRAPER_PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                    {!p.requiresKey && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Free
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {provider && (
            <p className="text-xs text-muted-foreground">{provider.description}</p>
          )}
        </div>

        {provider?.requiresKey && (
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Enter your ${provider.name} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || (provider?.requiresKey && !apiKey.trim())}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {provider && (
            <Button variant="ghost" asChild>
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Documentation
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
