import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Gift, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

type AuthStep = 'credentials' | 'check-email';

export default function Auth() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  
  const [step, setStep] = useState<AuthStep>('credentials');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        // Resend OTP for unverified users
        const { error: otpError } = await supabase.auth.resend({
          type: 'signup',
          email: loginEmail,
        });
        
        if (!otpError) {
          setPendingEmail(loginEmail);
          setStep('check-email');
          toast({
            title: 'Email Not Verified',
            description: 'Check your email and click the verification link.',
          });
        } else {
          toast({
            title: 'Login Failed',
            description: otpError.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }
    
    if (signupPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    });
    
    if (error) {
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setPendingEmail(signupEmail);
      setStep('check-email');
      toast({
        title: 'Verification Email Sent!',
        description: 'Check your email and click the link to verify.',
      });
    }
    
    setIsSubmitting(false);
  };


  const handleResendEmail = async () => {
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingEmail,
    });
    
    if (error) {
      toast({
        title: 'Failed to resend',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email Resent!',
        description: 'Check your inbox for the verification link.',
      });
    }
    
    setIsSubmitting(false);
  };

  // Check Email Step (Magic Link)
  if (step === 'check-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We sent a verification link to <span className="font-medium text-foreground">{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Click the "Verify Email" button</p>
                  <p>Open the email we just sent and click the verification button to activate your account.</p>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResendEmail}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setStep('credentials')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SEO Gap Analyzer</span>
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {isDemo 
              ? "Create a free account to get started" 
              : "Sign in to manage your company profiles"
            }
          </CardDescription>
          
          {/* Demo Banner */}
          {isDemo && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Gift className="h-4 w-4" />
                <span className="text-sm font-medium">4 Free Analyses Included!</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sign up now and get 4 free SEO analyses to try out the platform.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={isDemo ? "signup" : "login"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  We'll send a verification link to your email
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
