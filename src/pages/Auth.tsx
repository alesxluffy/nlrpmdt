import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, User, BadgeCheck, Mail, AlertTriangle, Radio, Fingerprint, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,4%)]">
        <div className="animate-pulse">
          <Shield className="w-20 h-20 text-primary" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast.error(error.message || 'Failed to sign in');
    } else {
      toast.success('Welcome back, Officer!');
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!firstName || !lastName) {
      toast.error('Please enter your name');
      setIsSubmitting(false);
      return;
    }

    const { data: isValid, error: validateError } = await supabase
      .rpc('validate_email_access', { email_input: signupEmail.trim() });

    if (validateError || !isValid) {
      toast.error('Your email is not authorized for registration. Contact High Command.');
      setIsSubmitting(false);
      return;
    }

    const { error, data } = await signUp(signupEmail, signupPassword, {
      first_name: firstName,
      last_name: lastName,
      badge_number: badgeNumber || `NEW-${Date.now().toString().slice(-6)}`,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } else {
      if (data?.user?.id) {
        await supabase.rpc('use_approved_email', { 
          email_input: signupEmail.trim(), 
          user_id_input: data.user.id 
        });
      }
      toast.success('Account created! Welcome to the force.');
    }

    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message || 'Failed to send reset email');
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setForgotEmail('');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,4%)] relative overflow-hidden">
      {/* Scan lines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(217,91%,60%) 2px, hsl(217,91%,60%) 4px)',
        backgroundSize: '100% 4px'
      }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `
          linear-gradient(hsl(217,91%,60%) 1px, transparent 1px),
          linear-gradient(90deg, hsl(217,91%,60%) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-police-red/5 blur-[80px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-police-blue/5 blur-[80px] rounded-full" />

      {/* Main terminal container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Terminal header bar */}
        <div className="bg-[hsl(222,47%,8%)] border border-border/50 rounded-t-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-police-red/80" />
            <div className="w-3 h-3 rounded-full bg-police-gold/80" />
            <div className="w-3 h-3 rounded-full bg-success/80" />
          </div>
          <span className="font-mono text-xs text-muted-foreground tracking-wider">MDT-TERMINAL-v2.4.1</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="w-3 h-3 animate-pulse text-success" />
            <span className="font-mono text-xs">CONNECTED</span>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-[hsl(222,47%,6%)]/95 backdrop-blur-xl border-x border-b border-border/50 rounded-b-lg overflow-hidden">
          {/* Header section */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-border/30">
            {/* Badge icon */}
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-[hsl(222,47%,12%)] to-[hsl(222,47%,8%)] rounded-full border-2 border-primary/30 flex items-center justify-center">
                <Shield className="w-12 h-12 text-primary" />
              </div>
              {/* Status ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-[spin_8s_linear_infinite]" style={{
                borderTopColor: 'transparent',
                borderRightColor: 'transparent'
              }} />
            </div>
            
            <h1 className="font-mono text-xl font-bold tracking-wider text-foreground mb-1">
              MOBILE DATA TERMINAL
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-8 h-px bg-border" />
              <span className="font-mono text-xs tracking-[0.2em] uppercase">Law Enforcement Access</span>
              <div className="w-8 h-px bg-border" />
            </div>
            
            {/* System status */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-muted-foreground">SYSTEM ONLINE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">SECURE CONNECTION</span>
              </div>
            </div>
          </div>

          {/* Form section */}
          <div className="p-8">
            {showForgotPassword ? (
              <div className="space-y-4">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>

                <div className="text-center mb-6">
                  <h2 className="font-mono text-lg font-bold tracking-wider text-foreground mb-1">
                    PASSWORD RECOVERY
                  </h2>
                  <p className="font-mono text-xs text-muted-foreground">
                    Enter your email to receive a password reset link
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="officer@lspd.gov"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full font-mono tracking-wider uppercase bg-primary hover:bg-primary/90 text-primary-foreground h-11" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        SENDING...
                      </span>
                    ) : (
                      'SEND RESET LINK'
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-[hsl(222,47%,8%)] p-1 rounded-lg">
                  <TabsTrigger 
                    value="login" 
                    className="font-mono text-sm tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                  >
                    SIGN IN
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="font-mono text-sm tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                  >
                    REGISTER
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="officer@lspd.gov"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full font-mono tracking-wider uppercase bg-primary hover:bg-primary/90 text-primary-foreground h-11" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          AUTHENTICATING...
                        </span>
                      ) : (
                        'ACCESS TERMINAL'
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-center font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Warning banner */}
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-semibold text-destructive tracking-wide">AUTHORIZED PERSONNEL ONLY</p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          Registration requires pre-approval by High Command.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                          First Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="first-name"
                            placeholder="John"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                          Last Name
                        </Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="badge-number" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                        Badge Number
                      </Label>
                      <div className="relative">
                        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="badge-number"
                          placeholder="LSPD-001"
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="officer@lspd.gov"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full font-mono tracking-wider uppercase bg-primary hover:bg-primary/90 text-primary-foreground h-11" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          PROCESSING...
                        </span>
                      ) : (
                        'REQUEST ACCESS'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-border/30 bg-[hsl(222,47%,5%)]">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>© {new Date().getFullYear()} UNIFIED POLICE DEPT</span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                ENCRYPTED
              </span>
            </div>
            <div className="text-center mt-2 text-xs font-mono text-muted-foreground/60">
              Made by ALESxLuffy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
