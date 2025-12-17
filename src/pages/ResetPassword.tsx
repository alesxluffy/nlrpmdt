import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if we have access token in URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!accessToken || type !== 'recovery') {
      toast.error('Invalid or expired reset link');
      navigate('/auth');
    }
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message || 'Failed to reset password');
    } else {
      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
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

      {/* Main terminal container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Terminal header bar */}
        <div className="bg-[hsl(222,47%,8%)] border border-border/50 rounded-t-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-police-red/80" />
            <div className="w-3 h-3 rounded-full bg-police-gold/80" />
            <div className="w-3 h-3 rounded-full bg-success/80" />
          </div>
          <span className="font-mono text-xs text-muted-foreground tracking-wider">PASSWORD-RESET</span>
        </div>

        {/* Main content */}
        <div className="bg-[hsl(222,47%,6%)]/95 backdrop-blur-xl border-x border-b border-border/50 rounded-b-lg overflow-hidden">
          {/* Header section */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-border/30">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-[hsl(222,47%,12%)] to-[hsl(222,47%,8%)] rounded-full border-2 border-primary/30 flex items-center justify-center">
                {isSuccess ? (
                  <CheckCircle className="w-10 h-10 text-success" />
                ) : (
                  <Shield className="w-10 h-10 text-primary" />
                )}
              </div>
            </div>
            
            <h1 className="font-mono text-xl font-bold tracking-wider text-foreground mb-1">
              {isSuccess ? 'PASSWORD UPDATED' : 'RESET PASSWORD'}
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {isSuccess ? 'Redirecting to login...' : 'Enter your new password below'}
            </p>
          </div>

          {/* Form section */}
          {!isSuccess && (
            <div className="p-8">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-[hsl(222,47%,8%)] border-border/50 font-mono text-sm focus:border-primary/50 focus:ring-primary/20"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      UPDATING...
                    </span>
                  ) : (
                    'UPDATE PASSWORD'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-4 border-t border-border/30 bg-[hsl(222,47%,5%)]">
            <div className="flex items-center justify-center text-xs font-mono text-muted-foreground">
              <span>© {new Date().getFullYear()} UNIFIED POLICE DEPT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
