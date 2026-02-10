import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { checkDemoMode } from '@/hooks/useDemoMode';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const PENDING_ORG_JOIN_KEY = 'pending_org_join';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSetup?: boolean;
}

export function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, organization, isLoading, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDemoMode = checkDemoMode();
  const [completingJoin, setCompletingJoin] = useState(false);
  const [joinDone, setJoinDone] = useState(false);

  // Complete pending org join (PM joined via invite link)
  useEffect(() => {
    if (!user || organization || !requireSetup) return;
    const pendingOrgId = typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_ORG_JOIN_KEY) : null;
    if (!pendingOrgId) return;

    let cancelled = false;
    setCompletingJoin(true);
    (async () => {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ organization_id: pendingOrgId })
          .eq('id', user.id);
        if (profileError) throw profileError;
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!existingRole) {
          await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'member' });
        }
        if (cancelled) return;
        try {
          window.localStorage.removeItem(PENDING_ORG_JOIN_KEY);
        } catch (_) {}
        await refreshProfile();
        setJoinDone(true);
        navigate('/first-outcome', { replace: true });
      } catch (e) {
        console.error('Error completing org join:', e);
        if (!cancelled) setCompletingJoin(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, organization, requireSetup, refreshProfile, navigate]);

  // Demo mode bypasses all auth checks
  if (isDemoMode) {
    return <>{children}</>;
  }

  if (isLoading || completingJoin || joinDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but no organization setup required
  if (!requireSetup) {
    return <>{children}</>;
  }

  // Logged in but no organization - redirect to setup (pending join handled above)
  if (!organization) {
    return <Navigate to="/setup" replace />;
  }

  // Logged in and organization exists but not setup complete
  if (!organization.setup_complete) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
