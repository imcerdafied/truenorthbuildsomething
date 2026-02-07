import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSetup?: boolean;
}

export function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, organization, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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

  // Logged in but no organization - redirect to setup
  if (!organization) {
    return <Navigate to="/setup" replace />;
  }

  // Logged in and organization exists but not setup complete
  if (!organization.setup_complete) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
