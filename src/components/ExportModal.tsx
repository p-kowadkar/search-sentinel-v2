import { useState } from "react";
import { Copy, Check, Globe, Loader2, ExternalLink, Megaphone, Twitter, Linkedin, MessageSquare, Facebook } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSocialAccounts } from "./SocialAccountsModal";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  title: string;
}

const SOCIAL_PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-foreground' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'text-orange-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
];

export function ExportModal({ isOpen, onClose, htmlContent, title }: ExportModalProps) {
  const { toast } = useToast();
  const { accounts } = useSocialAccounts();
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // WordPress state
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  
  // Squarespace state
  const [ssApiKey, setSsApiKey] = useState("");
  const [ssSiteId, setSsSiteId] = useState("");
  const [ssCollectionId, setSsCollectionId] = useState("");

  // Content Blast state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [blastMessage, setBlastMessage] = useState("");
  const [isBlasting, setIsBlasting] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "HTML content copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWordPressPublish = async () => {
    if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all WordPress fields.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-publish', {
        body: {
          platform: 'wordpress',
          title,
          content: htmlContent,
          credentials: {
            siteUrl: wpSiteUrl,
            username: wpUsername,
            appPassword: wpAppPassword,
          },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Published to WordPress!",
        description: `Your content is now live. Post ID: ${data.postId}`,
      });
      onClose();
    } catch (error) {
      console.error("WordPress publish error:", error);
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Failed to publish to WordPress.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSquarespacePublish = async () => {
    if (!ssApiKey || !ssSiteId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in API Key and Site ID.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-publish', {
        body: {
          platform: 'squarespace',
          title,
          content: htmlContent,
          credentials: {
            apiKey: ssApiKey,
            siteId: ssSiteId,
            collectionId: ssCollectionId,
          },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Published to Squarespace!",
        description: "Your content has been added to your site.",
      });
      onClose();
    } catch (error) {
      console.error("Squarespace publish error:", error);
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Failed to publish to Squarespace.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleContentBlast = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform to share to.",
        variant: "destructive",
      });
      return;
    }

    if (!blastMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message for your social posts.",
        variant: "destructive",
      });
      return;
    }

    setIsBlasting(true);
    
    // Simulate the blast - in production this would call the social-blast edge function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Content Blast Queued! 🚀",
      description: `Your message will be posted to ${selectedPlatforms.length} platform(s). (Feature in development)`,
    });
    
    setIsBlasting(false);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const connectedAccounts = accounts.filter(a => a.is_connected);
  const hasConnectedAccounts = connectedAccounts.length > 0;

  // Generate default blast message from title
  const generateDefaultMessage = () => {
    setBlastMessage(`📢 New content just dropped!\n\n${title}\n\n#SEO #ContentMarketing`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Export Content
          </DialogTitle>
          <DialogDescription>
            Copy the HTML, publish to your CMS, or share on social media.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="copy" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="copy" className="text-xs">Copy</TabsTrigger>
            <TabsTrigger value="wordpress" className="text-xs">WordPress</TabsTrigger>
            <TabsTrigger value="squarespace" className="text-xs">Squarespace</TabsTrigger>
            <TabsTrigger value="blast" className="text-xs">
              <Megaphone className="w-3 h-3 mr-1" />
              Blast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="copy" className="space-y-4">
            <div className="bg-muted rounded-lg p-4 max-h-48 overflow-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {htmlContent.slice(0, 500)}...
              </pre>
            </div>
            <Button onClick={handleCopy} className="w-full">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="wordpress" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="wp-url">Site URL</Label>
                <Input
                  id="wp-url"
                  placeholder="https://yoursite.com"
                  value={wpSiteUrl}
                  onChange={(e) => setWpSiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-user">Username</Label>
                <Input
                  id="wp-user"
                  placeholder="admin"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-pass">Application Password</Label>
                <Input
                  id="wp-pass"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Generate in WordPress → Users → Profile → Application Passwords
                </p>
              </div>
            </div>
            <Button 
              onClick={handleWordPressPublish} 
              className="w-full"
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Publish to WordPress
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="squarespace" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ss-api">API Key</Label>
                <Input
                  id="ss-api"
                  type="password"
                  placeholder="Your Squarespace API key"
                  value={ssApiKey}
                  onChange={(e) => setSsApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Settings → Developer API Keys → Generate Key
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ss-site">Site ID</Label>
                <Input
                  id="ss-site"
                  placeholder="Your site ID"
                  value={ssSiteId}
                  onChange={(e) => setSsSiteId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ss-collection">Collection ID (Optional)</Label>
                <Input
                  id="ss-collection"
                  placeholder="Blog or page collection ID"
                  value={ssCollectionId}
                  onChange={(e) => setSsCollectionId(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleSquarespacePublish} 
              className="w-full"
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Publish to Squarespace
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="blast" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Select Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const account = connectedAccounts.find(a => a.platform === platform.id);
                    const isConnected = !!account;
                    const Icon = platform.icon;

                    return (
                      <div
                        key={platform.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                          isConnected 
                            ? 'border-border bg-muted/30 cursor-pointer hover:bg-muted/50' 
                            : 'border-border/50 bg-muted/10 opacity-50'
                        }`}
                        onClick={() => isConnected && togglePlatform(platform.id)}
                      >
                        <Checkbox
                          checked={selectedPlatforms.includes(platform.id)}
                          disabled={!isConnected}
                          onCheckedChange={() => isConnected && togglePlatform(platform.id)}
                        />
                        <Icon className={`w-4 h-4 ${platform.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{platform.name}</p>
                          {isConnected ? (
                            <p className="text-xs text-muted-foreground truncate">
                              @{account.account_name}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Not linked</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!hasConnectedAccounts && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Link your social accounts in Settings to enable content blasting.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="blast-message">Message</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateDefaultMessage}
                    className="text-xs h-6"
                  >
                    Generate
                  </Button>
                </div>
                <Textarea
                  id="blast-message"
                  placeholder="Write your social media post..."
                  value={blastMessage}
                  onChange={(e) => setBlastMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {blastMessage.length}/280 characters
                </p>
              </div>

              <Button
                onClick={handleContentBlast}
                className="w-full"
                disabled={isBlasting || selectedPlatforms.length === 0}
              >
                {isBlasting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Blasting...
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4 mr-2" />
                    Blast to {selectedPlatforms.length || 'Selected'} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  🚧 <strong>Work in Progress:</strong> Full social media API integration coming soon.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
