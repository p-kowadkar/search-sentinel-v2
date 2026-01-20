import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Trash2, ExternalLink, Check } from 'lucide-react';
import { LLMProvider, LLMProviderId } from '@/lib/llm-providers';

interface ApiKeyCardProps {
  provider: LLMProvider;
  currentKey?: string;
  currentModelId?: string;
  onSave: (provider: LLMProviderId, apiKey: string, modelId?: string) => Promise<boolean>;
  onDelete: (provider: LLMProviderId) => Promise<boolean>;
}

export function ApiKeyCard({
  provider,
  currentKey,
  currentModelId,
  onSave,
  onDelete,
}: ApiKeyCardProps) {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [modelId, setModelId] = useState(currentModelId || (provider.models.length > 0 ? provider.models[0].id : ''));
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isConfigured = !!currentKey;
  const hasChanges = apiKey !== (currentKey || '') || modelId !== (currentModelId || '');
  const isOpenRouter = provider.id === 'openrouter';
  const hasModels = provider.models.length > 0;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    const selectedModelId = isOpenRouter ? modelId.trim() : (hasModels ? modelId : undefined);
    const success = await onSave(provider.id, apiKey.trim(), selectedModelId);
    if (success) {
      setShowKey(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const success = await onDelete(provider.id);
    if (success) {
      setApiKey('');
      setModelId(provider.models.length > 0 ? provider.models[0].id : '');
    }
    setDeleting(false);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const selectedModel = provider.models.find(m => m.id === modelId);

  return (
    <Card className={isConfigured ? 'border-primary/30 bg-primary/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{provider.icon}</span>
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <CardDescription className="text-xs">{provider.description}</CardDescription>
            </div>
          </div>
          {isConfigured && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
              <Check className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`${provider.id}-key`} className="text-sm">
            API Key
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`${provider.id}-key`}
                type={showKey ? 'text' : 'password'}
                placeholder={isConfigured ? maskKey(currentKey!) : `Enter your ${provider.name} API key`}
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

        {/* Model Selection - Dropdown for providers with models */}
        {hasModels && !isOpenRouter && (
          <div className="space-y-2">
            <Label htmlFor={`${provider.id}-model`} className="text-sm">
              Model
            </Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger id={`${provider.id}-model`} className="w-full bg-background">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {provider.models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      {model.supportsReasoning && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          Reasoning
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel && (
              <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
            )}
          </div>
        )}

        {/* OpenRouter - Custom model ID input */}
        {isOpenRouter && (
          <div className="space-y-2">
            <Label htmlFor={`${provider.id}-model`} className="text-sm">
              Model ID (e.g., anthropic/claude-4.5-sonnet)
            </Label>
            <Input
              id={`${provider.id}-model`}
              placeholder="anthropic/claude-4.5-sonnet"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!apiKey.trim() || !hasChanges || saving}
          >
            {saving ? 'Saving...' : isConfigured ? 'Update' : 'Save'}
          </Button>
          {isConfigured && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {deleting ? 'Removing...' : 'Remove'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            asChild
          >
            <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              Docs
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
