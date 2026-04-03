import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { checkDemoMode } from '@/hooks/useDemoMode';

interface MemberOnlyRouteProps {
  children: ReactNode;
}

export function MemberOnlyRoute({ children }: MemberOnlyRouteProps) {
  const { isAdmin, user } = useAuth();
  const isDemoMode = checkDemoMode();

  // Demo mode only bypasses auth for unauthenticated visitors (read-only sandbox)
  if (isDemoMode && !user) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
