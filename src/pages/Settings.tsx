import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserApiKeys } from '@/hooks/useUserApiKeys';
import { useTheme } from '@/hooks/useTheme';
import { LLM_PROVIDERS, LLMProviderId } from '@/lib/llm-providers';
import { ApiKeyCard } from '@/components/settings/ApiKeyCard';
import { ScraperConfigCard } from '@/components/settings/ScraperConfigCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings as SettingsIcon, Key, Bot, Shield, Palette, Moon, Sun } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    apiKeys,
    scraperConfig,
    loading,
    saveApiKey,
    deleteApiKey,
    saveScraperConfig,
  } = useUserApiKeys();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to manage your settings.</p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const getApiKeyForProvider = (providerId: LLMProviderId) => {
    const key = apiKeys.find(k => k.provider === providerId);
    return key?.api_key;
  };

  const getModelIdForProvider = (providerId: LLMProviderId) => {
    const key = apiKeys.find(k => k.provider === providerId);
    return key?.model_id || undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Appearance</h2>
              <p className="text-muted-foreground">
                Customize how the app looks
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Theme
              </CardTitle>
              <CardDescription>
                Toggle between light and dark mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* API Keys Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">API Configuration</h2>
              <p className="text-muted-foreground">
                Add your own API keys to unlock LLM comparison features
              </p>
            </div>
          </div>

          {/* LLM Providers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">LLM Providers</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure multiple providers to compare their responses. Only providers with configured keys will appear in LLM Comparison results.
            </p>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {LLM_PROVIDERS.map((provider) => (
                  <ApiKeyCard
                    key={provider.id}
                    provider={provider}
                    currentKey={getApiKeyForProvider(provider.id)}
                    currentModelId={getModelIdForProvider(provider.id)}
                    onSave={saveApiKey}
                    onDelete={deleteApiKey}
                  />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Scraper Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Web Scraping</h3>
            </div>
            
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ScraperConfigCard
                currentProvider={scraperConfig?.active_provider as any || 'firecrawl_default'}
                currentApiKey={scraperConfig?.api_key || undefined}
                onSave={saveScraperConfig}
              />
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Note
            </h4>
            <p className="text-sm text-muted-foreground">
              Your API keys are encrypted and stored securely. They are only used to make requests on your behalf 
              and are never shared or logged. You can remove them at any time.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
