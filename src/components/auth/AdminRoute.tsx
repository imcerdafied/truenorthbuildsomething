import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { checkDemoMode } from '@/hooks/useDemoMode';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, user } = useAuth();
  const isDemoMode = checkDemoMode();

  // Demo mode only bypasses auth for unauthenticated visitors (read-only sandbox)
  if (isDemoMode && !user) return <>{children}</>;
  if (isAdmin) return <>{children}</>;
  return <Navigate to="/" replace />;
}
