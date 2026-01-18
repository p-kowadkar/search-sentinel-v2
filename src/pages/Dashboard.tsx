import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Building2, Globe, Trash2, ArrowRight, LogOut, Sparkles } from 'lucide-react';

interface CompanyProfile {
  id: string;
  name: string;
  website_url: string | null;
  description: string | null;
  target_audience: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading companies',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCompanies(data || []);
    }
    setLoadingCompanies(false);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const { data, error } = await supabase
      .from('company_profiles')
      .insert({
        name: newName,
        website_url: newWebsite || null,
        user_id: user!.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating company',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCompanies([data, ...companies]);
      setNewName('');
      setNewWebsite('');
      setDialogOpen(false);
      toast({
        title: 'Company created!',
        description: `${data.name} has been added to your profiles.`,
      });
    }
    setIsCreating(false);
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    const { error } = await supabase
      .from('company_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting company',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCompanies(companies.filter((c) => c.id !== id));
      toast({
        title: 'Company deleted',
        description: `${name} has been removed.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SEO Gap Analyzer</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Company Profiles</h1>
            <p className="text-muted-foreground mt-1">
              Manage your company profiles and run SEO analysis
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Company Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Acme Corp"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">Website (optional)</Label>
                  <Input
                    id="company-website"
                    type="url"
                    placeholder="https://example.com"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Company
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingCompanies ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : companies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first company profile to start analyzing SEO gaps
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card key={company.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        {company.website_url && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Globe className="h-3 w-3" />
                            {new URL(company.website_url).hostname}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteCompany(company.id, company.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {company.description || 'No description yet'}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/company/${company.id}`)}
                  >
                    Open Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
