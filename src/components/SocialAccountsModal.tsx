import { useState, useEffect } from "react";
import { Twitter, Linkedin, MessageSquare, Facebook, Plus, Trash2, Settings, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  is_connected: boolean;
}

const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-foreground' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'text-orange-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
];

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SocialAccountsModal({ isOpen, onClose }: SocialAccountsModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      fetchAccounts();
    }
  }, [isOpen, user]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platformId: string) => {
    if (!user || !accountName.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your username for this platform.",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingAccount = accounts.find(a => a.platform === platformId);
      
      if (existingAccount) {
        // Update existing
        const { error } = await supabase
          .from('social_accounts')
          .update({ 
            account_name: accountName,
            is_connected: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('social_accounts')
          .insert({
            user_id: user.id,
            platform: platformId,
            account_name: accountName,
            is_connected: true,
          });

        if (error) throw error;
      }

      toast({
        title: "Account linked!",
        description: `Your ${platformId} account has been saved.`,
      });
      
      setEditingPlatform(null);
      setAccountName("");
      fetchAccounts();
    } catch (error) {
      console.error('Error connecting account:', error);
      toast({
        title: "Error",
        description: "Failed to save account.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Account removed",
        description: "Social account has been disconnected.",
      });
      
      fetchAccounts();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to remove account.",
        variant: "destructive",
      });
    }
  };

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Social Media Accounts
          </DialogTitle>
          <DialogDescription>
            Link your social accounts for content distribution. (OAuth coming soon)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const account = getAccountForPlatform(platform.id);
              const isEditing = editingPlatform === platform.id;
              const Icon = platform.icon;

              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${platform.color}`} />
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      {account?.is_connected ? (
                        <p className="text-xs text-muted-foreground">
                          @{account.account_name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="@username"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-32 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPlatform(null);
                          setAccountName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : account?.is_connected ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Connected
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnect(account.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPlatform(platform.id);
                        setAccountName(account?.account_name || "");
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Link
                    </Button>
                  )}
                </div>
              );
            })}

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                🚧 <strong>Work in Progress:</strong> Full OAuth integration and automated posting coming soon.
                For now, save your usernames to enable content blast features.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook to get connected accounts
export function useSocialAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { accounts, isLoading, refetch: fetchAccounts };
}
