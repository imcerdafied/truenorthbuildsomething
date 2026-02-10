import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { checkDemoMode } from '@/hooks/useDemoMode';

interface MemberOnlyRouteProps {
  children: ReactNode;
}

export function MemberOnlyRoute({ children }: MemberOnlyRouteProps) {
  const { isAdmin } = useAuth();
  const isDemoMode = checkDemoMode();

  if (isDemoMode) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
