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
  Target,
  Compass,
  Brain,
} from 'lucide-react';

export default function Welcome() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPersonalPath, setHasPersonalPath] = useState(false);
  const [pathTitle, setPathTitle] = useState('');
  const [pathProgress, setPathProgress] = useState(0);

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
      } catch (err) {
        console.error('Error loading welcome data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user) loadData();
  }, [user, loading]);

  // Auto-trigger path generation when committed but not generated
  useEffect(() => {
    const autoGenerate = async () => {
      if (!user || !profile) return;
      if (profile.path_committed && !profile.personal_path_generated && !isGenerating && !hasPersonalPath) {
        await generatePersonalPath();
      }
    };

    if (!loading && !loadingData && profile) {
      autoGenerate();
    }
  }, [user, profile, loading, loadingData, hasPersonalPath]);

  const generatePersonalPath = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // Fetch commitment, reality report, and onboarding data in parallel
      const [commitRes, realityRes, profileRes] = await Promise.all([
        supabase
          .from('path_commitments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('reality_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('career_goals')
          .eq('user_id', user.id)
          .single(),
      ]);

      const commitment = commitRes.data;
      const realityReport = realityRes.data;
      const careerGoals = profileRes.data?.career_goals as Record<string, any> | null;

      if (!commitment) {
        toast.error('No commitment found. Please complete the commitment step first.');
        navigate('/commit');
        return;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-personal-path', {
        body: {
          commitment: {
            time_budget: commitment.time_budget,
            intent: commitment.intent,
            constraints: commitment.constraints,
            focus_area: commitment.focus_area,
          },
          reality_report: realityReport ? {
            strengths: realityReport.strengths,
            key_constraints: realityReport.key_constraints,
            risks: realityReport.risks,
            generated_summary: realityReport.generated_summary,
          } : null,
          onboarding: careerGoals || {},
          chosen_path: commitment.chosen_path,
        },
      });

      if (error) throw error;

      const personalPath = data.personal_path;

      // Save to personal_paths table
      const { error: insertError } = await supabase
        .from('personal_paths')
        .insert({
          user_id: user.id,
          title: personalPath.title || 'My Personal Path',
          description: personalPath.description || null,
          phases: personalPath.phases as unknown as Json,
          total_progress: 0,
          is_active: true,
        });

      if (insertError) throw insertError;

      // Update profile flag
      await supabase
        .from('profiles')
        .update({ personal_path_generated: true } as any)
        .eq('user_id', user.id);

      setHasPersonalPath(true);
      setPathTitle(personalPath.title);
      setPathProgress(0);
      toast.success('Your personal path has been generated!');
    } catch (err: any) {
      console.error('Error generating personal path:', err);
      if (err.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else {
        toast.error('Failed to generate your path. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your workspace..." />
      </div>
    );
  }

  const userName = user?.email?.split('@')[0] || 'there';

  // Generating state
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader showHomeLink={false} />
        <main className="container max-w-3xl py-20 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-primary/10 mb-6">
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Building Your Personal Path
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
              Our AI is crafting a personalized execution plan based on your commitment, personality, and goals...
            </p>
            <p className="text-sm text-muted-foreground">This usually takes 15-30 seconds.</p>
          </div>
        </main>
      </div>
    );
  }

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
              : 'Complete the CLARITY flow to unlock your personal path.'
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

            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="bg-secondary-foreground/10 text-secondary-foreground">
                {pathProgress}% Complete
              </Badge>
            </div>

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
                  Complete Your CLARITY Journey
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

        {/* Committed but generation failed - manual retry */}
        {profile?.path_committed && !hasPersonalPath && !isGenerating && (
          <div className="chamfer bg-card border border-border p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  Generate Your Personal Path
                </h2>
                <p className="text-muted-foreground mb-4">
                  You've committed to a path. Let our AI create your personalized execution plan.
                </p>
                <Button onClick={generatePersonalPath} className="rounded-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate My Path
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {hasPersonalPath && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="chamfer bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
              </div>
              <p className="text-lg font-semibold">
                {pathProgress === 100 ? 'Complete!' : pathProgress > 0 ? 'In Progress' : 'Ready to Start'}
              </p>
            </div>
            <div className="chamfer bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Progress</span>
              </div>
              <p className="text-lg font-semibold">{pathProgress}%</p>
            </div>
            <div className="chamfer bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Path</span>
              </div>
              <p className="text-lg font-semibold truncate">{pathTitle}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
