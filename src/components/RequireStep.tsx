import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkPrerequisites, FlowProgress, defaultFlowProgress } from '@/lib/flowPrerequisites';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { toast } from 'sonner';

const LOCAL_PROGRESS_KEY = 'flow_progress';

/** Read flow progress flags from localStorage (for non-authenticated users). */
function getLocalProgress(): FlowProgress {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (raw) return { ...defaultFlowProgress, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultFlowProgress;
}

/** Write a flow progress flag to localStorage. */
export function setLocalProgress(flag: keyof FlowProgress, value: boolean) {
  const current = getLocalProgress();
  current[flag] = value;
  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(current));
}

interface RequireStepProps {
  children: ReactNode;
  /** If true, also requires authentication (redirects to /auth if not logged in) */
  requireAuth?: boolean;
}

export function RequireStep({ children, requireAuth = true }: RequireStepProps) {
  const { user, loading: authLoading, isAdmin, emailVerified } = useAuth();
  const location = useLocation();
  const [progress, setProgress] = useState<FlowProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        // Use localStorage progress for non-authenticated users
        setProgress(getLocalProgress());
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_complete, step1_completed, challenges_complete, wheel_of_life_complete, blob_tree_complete, value_map_complete, reality_report_generated, path_options_shown, path_committed, personal_path_generated')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching flow progress:', error);
          setProgress(defaultFlowProgress);
        } else if (data) {
          setProgress(data as FlowProgress);
        } else {
          setProgress(defaultFlowProgress);
        }
      } catch (err) {
        console.error('Error fetching flow progress:', err);
        setProgress(defaultFlowProgress);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProgress();
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <LoadingSpinner />;

  // Auth check
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Email verification check
  if (requireAuth && user && !emailVerified) {
    return <Navigate to="/auth" state={{ from: location.pathname, unverified: true }} replace />;
  }

  // Admins bypass all prerequisite checks
  if (isAdmin) return <>{children}</>;

  // Prerequisite check
  if (progress) {
    const check = checkPrerequisites(location.pathname, progress);
    if (!check.allowed && check.redirectTo) {
      if (check.bannerMessage) {
        setTimeout(() => toast.info(check.bannerMessage), 0);
      }
      return <Navigate to={check.redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
