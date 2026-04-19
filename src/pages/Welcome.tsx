import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { clearAuraReturnFlag } from '@/hooks/useAuraReturn';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Waypoints,
  Compass,
  Activity,
  TrendingUp,
  MessageSquare,
  Clock,
} from 'lucide-react';

export default function Welcome() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(true);
  const [hasPersonalPath, setHasPersonalPath] = useState(false);
  const [pathTitle, setPathTitle] = useState('');
  const [pathProgress, setPathProgress] = useState(0);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [hasCoach, setHasCoach] = useState(false);
  const [coachAppPending, setCoachAppPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Clear the Aura flow flag now that the user has successfully reached the dashboard.
  useEffect(() => { clearAuraReturnFlag(); }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [pathRes, assignmentRes, appRes] = await Promise.all([
          supabase
            .from('personal_paths')
            .select('id, title, total_progress')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('coach_assignments' as any)
            .select('coach_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(),
          supabase
            .from('coach_applications' as any)
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if ((appRes.data as any)?.status === 'pending') {
          setCoachAppPending(true);
        }

        if (pathRes.data) {
          setHasPersonalPath(true);
          setPathTitle(pathRes.data.title);
          setPathProgress(pathRes.data.total_progress);
        }

        if (assignmentRes.data) {
          setHasCoach(true);
          const { data: coachProfile } = await supabase
            .from('coach_profiles' as any)
            .select('display_name')
            .eq('user_id', (assignmentRes.data as any).coach_id)
            .maybeSingle();
          setCoachName((coachProfile as any)?.display_name || 'Your Coach');
        }
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
              ? "Your skill path is ready. Let's make progress."
              : hasCoach
                ? 'Your coach is preparing your skill path.'
                : 'Complete the Be:More flow to unlock your skill path.'
            }
          </p>
        </div>

        {/* Coach application pending banner */}
        {coachAppPending && (
          <div className="mb-6 flex items-center gap-3 bg-accent/8 border border-accent/20 rounded-2xl px-5 py-4">
            <Clock className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">
              Your coach application is under review.{' '}
              <Link to="/become-a-coach" className="text-accent underline underline-offset-2 font-medium">
                View status
              </Link>
            </p>
          </div>
        )}

        {/* Personal Path Card */}
        {hasPersonalPath && (
          <div className="chamfer bg-secondary p-8 md:p-10 mb-8 animate-fade-up">
            <div className="flex items-center gap-2 text-secondary-foreground/70 text-sm mb-4">
              <Waypoints className="w-4 h-4" />
              <span>Your Skill Path</span>
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
                  Finish the assessment flow and commit to a path to unlock your personalized skill path.
                </p>
                <Button onClick={() => navigate('/onboarding')} className="rounded-full">
                  Continue Journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Committed — coach preparing path */}
        {profile?.path_committed && !hasPersonalPath && hasCoach && (
          <div className="chamfer bg-card border border-border p-8 mb-8 animate-fade-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 chamfer-sm bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  Your Coach is Building Your Path
                </h2>
                <p className="text-muted-foreground mb-4">
                  {coachName || 'Your coach'} is crafting a personalized skill path for you. You'll see it here as soon as it's ready.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/my-coach')}
                  className="rounded-full gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message {coachName || 'Your Coach'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Committed — no coach, no path (edge case) */}
        {profile?.path_committed && !hasPersonalPath && !hasCoach && (
          <div className="chamfer bg-card border border-border p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  Path Coming Soon
                </h2>
                <p className="text-muted-foreground">
                  Your skill path will appear here once your coach sets it up.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Coach card */}
        {coachName && (
          <div className="chamfer bg-card border border-border p-6 mb-8 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 chamfer-sm bg-accent/15 flex items-center justify-center flex-shrink-0 text-base font-semibold text-accent">
                {coachName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Your Coach</p>
                <p className="font-semibold text-foreground truncate">{coachName}</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/my-coach')}
                className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent btn-lift gap-2 flex-shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </Button>
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
                <CheckCircle2 className="w-4 h-4 text-accent" />
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
