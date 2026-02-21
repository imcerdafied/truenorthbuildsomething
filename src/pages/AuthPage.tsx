import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const PENDING_ORG_JOIN_KEY = 'pending_org_join';
const VALID_INVITE_CODE = 'truenorth2026';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; inviteCode?: string }>({});
  const [joinOrgId, setJoinOrgId] = useState<string | null>(null);
  const [inviteLinkError, setInviteLinkError] = useState<string | null>(null);
  const [orgCheckDone, setOrgCheckDone] = useState(false);

  const { signIn, signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate org param and persist for post-signup join
  useEffect(() => {
    if (!orgParam) {
      setOrgCheckDone(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgParam)
        .maybeSingle();
      if (cancelled) return;
      setOrgCheckDone(true);
      if (error || !data) {
        setInviteLinkError('This invite link is invalid or expired.');
        return;
      }
      setJoinOrgId(data.id);
      try {
        window.localStorage.setItem(PENDING_ORG_JOIN_KEY, data.id);
      } catch (_) {
        // Ignore localStorage failures (private mode / blocked storage).
      }
    })();
    return () => { cancelled = true; };
  }, [orgParam]);

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const requireInviteCode = isSignUp && !joinOrgId;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string; inviteCode?: string } = {};
    
    if (requireInviteCode) {
      if (!inviteCode.trim()) {
        newErrors.inviteCode = 'Please enter your invite code';
      }
    }
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp && !fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (requireInviteCode && inviteCode.trim().toLowerCase() !== VALID_INVITE_CODE.toLowerCase()) {
      toast({
        title: 'Invalid invite code',
        description: 'Invalid invite code. Contact your admin for access.',
        variant: 'destructive',
      });
      setErrors((prev) => ({ ...prev, inviteCode: 'Invalid invite code' }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'An account with this email already exists. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Invalid credentials',
              description: 'Please check your email and password and try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign in failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (orgParam && !orgCheckDone)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isJoinFlow = isSignUp && !!joinOrgId && !inviteLinkError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl tracking-tight">TrueNorthOS</span>
        </div>

        {inviteLinkError && (
          <Card className="bg-card border border-destructive/50 mb-4">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive text-center">{inviteLinkError}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {isJoinFlow ? 'Join your team on TrueNorth' : isSignUp ? 'Set your TrueNorth' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isJoinFlow
                ? 'Your organization is already set up. Create your account to start tracking outcomes.'
                : isSignUp
                  ? 'Create a shared view of outcomes, OKRs, and confidence for your team.'
                  : 'Sign in to your TrueNorth'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && requireInviteCode && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite code</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your invite code"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      if (errors.inviteCode) setErrors((prev) => ({ ...prev, inviteCode: undefined }));
                    }}
                    className={errors.inviteCode ? 'border-destructive' : ''}
                  />
                  {errors.inviteCode && (
                    <p className="text-xs text-destructive">{errors.inviteCode}</p>
                  )}
                </div>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Sarah Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isSignUp ? 'Continue' : 'Sign in'}
              </Button>

              {isSignUp && (
                <p className="text-sm text-muted-foreground text-center">
                  Make outcomes visible. Make confidence explicit.
                </p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                    if (isSignUp) setInviteCode('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp
                    ? 'Already have a TrueNorth? Sign in'
                    : 'Need a TrueNorth? Set one up'
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
