import { useState } from "react";
import { Copy, Check, Globe, Loader2, ExternalLink } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  title: string;
}

export function ExportModal({ isOpen, onClose, htmlContent, title }: ExportModalProps) {
  const { toast } = useToast();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Export Content
          </DialogTitle>
          <DialogDescription>
            Copy the HTML or publish directly to your CMS.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="copy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="copy">Copy HTML</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="squarespace">Squarespace</TabsTrigger>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
