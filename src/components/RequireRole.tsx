import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';

interface RequireRoleProps {
  /** 'coach' also admits admins (AuthContext treats admins as coaches). Omit to require sign-in only. */
  role?: 'coach' | 'admin';
  children: ReactNode;
}

/** Route guard: signed-in users, optionally with a coach/admin role. */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, loading, rolesLoading, isCoach, isAdmin } = useAuth();
  const location = useLocation();

  if (loading || (role && user && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;

  if (role) {
    const allowed = role === 'admin' ? isAdmin : isCoach;
    if (!allowed) return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
