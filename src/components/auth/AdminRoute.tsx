import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { checkDemoMode } from '@/hooks/useDemoMode';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin } = useAuth();
  const isDemoMode = checkDemoMode();

  if (isDemoMode || isAdmin) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
