import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import {
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Waypoints,
  Compass,
  Activity,
  TrendingUp,
  Target,
} from 'lucide-react';

export default function Welcome() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(true);
  const [hasPersonalPath, setHasPersonalPath] = useState(false);
  const [pathTitle, setPathTitle] = useState('');
  const [pathProgress, setPathProgress] = useState(0);
  const [hasCoach, setHasCoach] = useState(false);
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Check for existing active personal path
        const { data: pathData } = await supabase
          .from('personal_paths')
          .select('id, title, total_progress')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pathData) {
          setHasPersonalPath(true);
          setPathTitle(pathData.title);
          setPathProgress(pathData.total_progress);
        }

        // Check if user has a coach
        const { data: coachAssignment } = await supabase
          .from('coach_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        setHasCoach(!!coachAssignment);
      } catch (err) {
        console.error('Error loading welcome data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user) loadData();
  }, [user, loading]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your workspace..." />
      </div>
    );
  }

  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <UserHeader showHomeLink={false} />

      <main className="container max-w-4xl py-12 px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground text-lg">
            {hasPersonalPath
              ? 'Your personal path is ready. Let\'s make progress.'
              : 'Complete the Be:More flow to unlock your personal path.'
            }
          </p>
        </div>

        {/* Personal Path Card */}
        {hasPersonalPath && (
          <div className="chamfer bg-secondary p-8 md:p-10 mb-8 animate-fade-up">
            <div className="flex items-center gap-2 text-secondary-foreground/70 text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Your Personal Path</span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-secondary-foreground mb-2">
              {pathTitle}
            </h2>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-secondary-foreground/70">Progress</span>
                <span className="font-medium text-secondary-foreground">{pathProgress}%</span>
              </div>
              <Progress value={pathProgress} className="h-2" />
            </div>

            <Button
              size="lg"
              className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 px-8 py-6 text-lg rounded-full"
              onClick={() => navigate('/path')}
            >
              {pathProgress > 0 ? 'Continue Path' : 'Start Path'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Not committed yet */}
        {!profile?.path_committed && (
          <div className="chamfer bg-card border border-border p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Compass className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  Complete Your Be:More Journey
                </h2>
                <p className="text-muted-foreground mb-4">
                  Finish the assessment flow and commit to a path to unlock your personalized execution plan.
                </p>
                <Button onClick={() => navigate('/onboarding')} className="rounded-full">
                  Continue Journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Committed but no path yet — coach-driven */}
        {profile?.path_committed && !hasPersonalPath && hasCoach && (
          <div className="chamfer bg-card border border-border p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  Your Coach is Building Your Path
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your coach is preparing a personalized skill path for you. In the meantime, you can message them.
                </p>
                <Button onClick={() => navigate('/my-coach')} className="rounded-full">
                  Message Your Coach
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Committed but no path and no coach */}
        {profile?.path_committed && !hasPersonalPath && !hasCoach && (
          <div className="chamfer bg-card border border-border p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  Your Path Will Appear Here
                </h2>
                <p className="text-muted-foreground">
                  Your path will appear here once your coach sets it up.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {hasPersonalPath && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="chamfer bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Status</span>
              </div>
              <p className="text-lg font-semibold">
                {pathProgress === 100 ? 'Complete!' : pathProgress > 0 ? 'In Progress' : 'Ready to Start'}
              </p>
            </div>
            <div className="chamfer bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-pop" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Progress</span>
              </div>
              <p className="text-lg font-semibold">{pathProgress}%</p>
            </div>
            <div className="chamfer bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Waypoints className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Path</span>
              </div>
              <p className="text-lg font-semibold truncate">{pathTitle}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
