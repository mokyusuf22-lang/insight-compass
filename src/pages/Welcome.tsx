import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { GoalReview } from '@/components/GoalReview';
import { 
  ArrowRight, 
  Lock, 
  Brain, 
  Target,
  Zap,
  CheckCircle2,
  Sparkles,
  Users,
  Star,
  Compass,
  MessageSquare,
  Edit2
} from 'lucide-react';

interface UserProgress {
  step1Completed: boolean;
  mbtiCompleted: boolean;
  discCompleted: boolean;
  strengthsCompleted: boolean;
  strategyGenerated: boolean;
  currentPhase?: string;
  todaysFocus?: string;
}

interface AssessmentResults {
  mbtiType?: string;
  discProfile?: { primary: string; secondary?: string };
  topStrengths?: string[];
}

export default function Welcome() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress>({
    step1Completed: false,
    mbtiCompleted: false,
    discCompleted: false,
    strengthsCompleted: false,
    strategyGenerated: false,
  });
  const [results, setResults] = useState<AssessmentResults>({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      
      try {
        // Fetch profile for completion flags
        const { data: profileData } = await supabase
          .from('profiles')
          .select('step1_completed, mbti_completed, disc_completed, strengths_completed, strategy_generated')
          .eq('user_id', user.id)
          .maybeSingle();

        // Fetch career strategy for current phase
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('strategy')
          .eq('user_id', user.id)
          .maybeSingle();

        // Fetch assessment results in parallel
        const [mbtiRes, discRes, strengthsRes] = await Promise.all([
          supabase
            .from('mbti_assessments')
            .select('result')
            .eq('user_id', user.id)
            .eq('is_complete', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('disc_assessments')
            .select('result')
            .eq('user_id', user.id)
            .eq('is_complete', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('strengths_assessments')
            .select('result')
            .eq('user_id', user.id)
            .eq('is_complete', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const strategy = strategyData?.strategy as { phases?: { name: string }[] } | null;
        const mbtiResult = mbtiRes.data?.result as { type?: string; axisResults?: Record<string, { percentage: number }> } | null;
        const discResult = discRes.data?.result as { D?: number; I?: number; S?: number; C?: number; primaryStyle?: string; secondaryStyle?: string | null } | null;
        const strengthsResult = strengthsRes.data?.result as { ranked_strengths?: { name: string; score: number }[] } | null;
        
        setProgress({
          step1Completed: profileData?.step1_completed || false,
          mbtiCompleted: profileData?.mbti_completed || false,
          discCompleted: profileData?.disc_completed || false,
          strengthsCompleted: profileData?.strengths_completed || false,
          strategyGenerated: profileData?.strategy_generated || false,
          currentPhase: strategy?.phases?.[0]?.name,
        });

        // Extract primary letter from "High C" -> "C"
        const primaryLetter = discResult?.primaryStyle?.replace('High ', '').split(' ')[0] || '';
        const secondaryLetter = discResult?.secondaryStyle?.replace('High ', '') || undefined;

        setResults({
          mbtiType: mbtiResult?.type,
          discProfile: discResult ? { primary: primaryLetter, secondary: secondaryLetter } : undefined,
          topStrengths: strengthsResult?.ranked_strengths?.slice(0, 5).map(s => s.name),
        });
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [user]);

  if (loading || loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your workspace..." />
      </div>
    );
  }

  const hasPaid = profile?.has_paid;
  const userName = user?.email?.split('@')[0] || 'there';
  const completedSteps = [progress.step1Completed, progress.mbtiCompleted, progress.discCompleted].filter(Boolean).length;
  const allAssessmentsComplete = progress.mbtiCompleted && progress.discCompleted && progress.strengthsCompleted;

  // ============================================
  // FREE USER VIEW - Exploration Mode
  // ============================================
  if (!hasPaid) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader showHomeLink={false} />

        <main className="container max-w-3xl py-12 px-4 md:px-8">
          {/* Simple Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-3">
              Welcome to your career workspace
            </h1>
            <p className="text-muted-foreground text-lg">
              Start with a quick assessment to get your first AI insight.
            </p>
          </div>

          {/* Primary CTA Card - Dominates the page */}
          <div className="chamfer bg-primary p-8 md:p-10 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 chamfer-sm bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-semibold text-primary-foreground mb-2">
                  Start your Quick Assessment
                </h2>
                <p className="text-primary-foreground/80 text-sm">
                  5 minutes • 20 questions
                </p>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-primary-foreground/90">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground flex-shrink-0" />
                <span>20-question personality screener</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground flex-shrink-0" />
                <span>Career goals & constraints analysis</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground flex-shrink-0" />
                <span>Instant AI profile hypothesis</span>
              </li>
            </ul>

            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-6 text-lg rounded-full"
              onClick={() => navigate('/assessment/step1')}
            >
              Start Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Locked Preview Card */}
          <div className="chamfer bg-card border border-border p-6 mb-8 opacity-80">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 chamfer-sm bg-muted flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Deep Personality Profiling
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  MBTI (93 questions) • DISC • Strengths Assessment
                </p>
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 chamfer-sm inline-block">
                  Available on Pro
                </span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="chamfer bg-muted/50 p-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium text-foreground">
                {completedSteps} / 3 core steps completed
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-muted chamfer-sm overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(completedSteps / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Soft Upgrade CTA */}
          <div className="text-center py-6 border-t border-border">
            <p className="text-muted-foreground text-sm mb-3">
              Want a structured roadmap and weekly coaching?
            </p>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80"
              onClick={() => navigate('/paywall')}
            >
              View plans
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // PAID USER VIEW - Execution Mode (Control Center)
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      <UserHeader showHomeLink={false} />

      <main className="container max-w-4xl py-12 px-4 md:px-8">
        {/* Personalized Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Your career transition is in progress.
          </p>
          {progress.currentPhase && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-2 chamfer-sm">
              <Zap className="w-4 h-4" />
              <span>Current phase: {progress.currentPhase}</span>
            </div>
          )}
        </div>

        {/* Today's Focus - Hero Element */}
        <div className="chamfer bg-secondary p-8 md:p-10 mb-8">
          <div className="flex items-center gap-2 text-secondary-foreground/70 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Today's Focus</span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-secondary-foreground mb-4">
            {progress.strategyGenerated 
              ? "Continue your weekly execution plan"
              : allAssessmentsComplete
                ? "Generate your personalized career strategy"
                : progress.step1Completed
                  ? "Complete your personality assessments"
                  : "Start with your Quick Assessment"
            }
          </h2>
          
          <p className="text-secondary-foreground/80 mb-6">
            {progress.strategyGenerated
              ? "Review your tasks and track progress on your career goals."
              : allAssessmentsComplete
                ? "All assessments complete! Generate your AI-powered career roadmap."
                : progress.step1Completed
                  ? "Deep-dive into MBTI, DISC, and Strengths to unlock your full strategy."
                  : "20 questions to understand your career context and goals."
            }
          </p>

          <Button
            size="lg"
            className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 px-8 py-6 text-lg rounded-full"
            onClick={() => {
              if (progress.strategyGenerated) {
                navigate('/path');
              } else if (allAssessmentsComplete) {
                navigate('/path');
              } else if (progress.step1Completed) {
                navigate('/assessment/mbti');
              } else {
                navigate('/assessment/step1');
              }
            }}
          >
            {progress.strategyGenerated ? "View Skill Path" : allAssessmentsComplete ? "Generate Skill Path" : "Continue"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Assessment Results Summary Cards */}
        {(results.mbtiType || results.discProfile || results.topStrengths) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Your Profile Summary
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/results')}
                className="text-primary"
              >
                View Full Results
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* MBTI Card */}
              <button
                onClick={() => navigate('/assessment/mbti/results')}
                className="chamfer bg-card border border-border p-5 text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Personality</span>
                </div>
                <p className="text-3xl font-serif font-bold text-foreground">
                  {results.mbtiType || '—'}
                </p>
                {!results.mbtiType && (
                  <p className="text-xs text-muted-foreground mt-1">Complete MBTI</p>
                )}
              </button>

              {/* DISC Card */}
              <button
                onClick={() => navigate('/assessment/disc/results')}
                className="chamfer bg-card border border-border p-5 text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Behavior</span>
                </div>
                <p className="text-2xl font-serif font-bold text-foreground">
                  {results.discProfile?.primary || '—'}
                </p>
                {results.discProfile?.secondary && (
                  <p className="text-xs text-muted-foreground mt-1">+ {results.discProfile.secondary}</p>
                )}
                {!results.discProfile && (
                  <p className="text-xs text-muted-foreground mt-1">Complete DISC</p>
                )}
              </button>

              {/* Strengths Card */}
              <button
                onClick={() => navigate('/assessment/strengths/results')}
                className="chamfer bg-card border border-border p-5 text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Top Strengths</span>
                </div>
                {results.topStrengths && results.topStrengths.length > 0 ? (
                  <div className="space-y-1">
                    {results.topStrengths.slice(0, 3).map((strength, i) => (
                      <p key={strength} className={`text-sm ${i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {i + 1}. {strength}
                      </p>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-serif font-bold text-foreground">—</p>
                    <p className="text-xs text-muted-foreground mt-1">Complete Strengths</p>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Career Goals Section */}
        <div className="chamfer bg-card p-6 mb-8">
          <GoalReview showTitle={true} />
        </div>

        {/* Progress Overview */}
        <div className="chamfer bg-card p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">Progress Overview</h3>
          
          <div className="space-y-4">
            {/* Assessments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Assessments</span>
                <span className="text-sm font-medium">
                  {[progress.step1Completed, progress.mbtiCompleted, progress.discCompleted, progress.strengthsCompleted].filter(Boolean).length} / 4
                </span>
              </div>
              <div className="h-2 bg-muted chamfer-sm overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${([progress.step1Completed, progress.mbtiCompleted, progress.discCompleted, progress.strengthsCompleted].filter(Boolean).length / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Strategy */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Career Strategy</span>
              {progress.strategyGenerated ? (
                <span className="text-sm text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Generated
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Journey */}
        <div className="chamfer bg-card p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">Assessment Journey</h3>
          
          <div className="space-y-3">
            <AssessmentItem
              title="Quick Assessment"
              description="Career context & goals"
              completed={progress.step1Completed}
              onClick={() => navigate(progress.step1Completed ? '/assessment/step1/results' : '/assessment/step1')}
            />
            <AssessmentItem
              title="MBTI Assessment"
              description="93 personality questions"
              completed={progress.mbtiCompleted}
              onClick={() => navigate(progress.mbtiCompleted ? '/assessment/mbti/results' : '/assessment/mbti')}
            />
            <AssessmentItem
              title="DISC Assessment"
              description="Behavioral style analysis"
              completed={progress.discCompleted}
              onClick={() => navigate(progress.discCompleted ? '/assessment/disc/results' : '/assessment/disc')}
            />
            <AssessmentItem
              title="Strengths Assessment"
              description="Core strengths identification"
              completed={progress.strengthsCompleted}
              onClick={() => navigate(progress.strengthsCompleted ? '/assessment/strengths/results' : '/assessment/strengths')}
            />
          </div>
        </div>

        {/* Strategy & Coaching Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Career Strategy */}
          <button
            onClick={() => {
              if (allAssessmentsComplete) {
                navigate('/strategy');
              }
            }}
            disabled={!allAssessmentsComplete}
            className={`chamfer p-6 text-left transition-all ${
              allAssessmentsComplete 
                ? 'bg-primary/10 border border-primary/20 hover:border-primary/50' 
                : 'bg-muted/50 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 chamfer-sm ${allAssessmentsComplete ? 'bg-primary/20' : 'bg-muted'}`}>
                <Compass className={`w-5 h-5 ${allAssessmentsComplete ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Career Strategy</h4>
                <p className="text-xs text-muted-foreground">AI-powered roadmap</p>
              </div>
            </div>
            {!allAssessmentsComplete && (
              <p className="text-xs text-muted-foreground">
                Complete all assessments to unlock
              </p>
            )}
            {progress.strategyGenerated && (
              <p className="text-xs text-primary">
                Strategy generated • View details →
              </p>
            )}
          </button>

          {/* Personal Coaching */}
          <button
            onClick={() => {
              if (progress.strategyGenerated) {
                navigate('/coaching');
              }
            }}
            disabled={!progress.strategyGenerated}
            className={`chamfer p-6 text-left transition-all ${
              progress.strategyGenerated 
                ? 'bg-secondary/10 border border-secondary/20 hover:border-secondary/50' 
                : 'bg-muted/50 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 chamfer-sm ${progress.strategyGenerated ? 'bg-secondary/20' : 'bg-muted'}`}>
                <MessageSquare className={`w-5 h-5 ${progress.strategyGenerated ? 'text-secondary-foreground' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Personal Coaching</h4>
                <p className="text-xs text-muted-foreground">Daily guidance</p>
              </div>
            </div>
            {!progress.strategyGenerated && (
              <p className="text-xs text-muted-foreground">
                Generate strategy first to unlock
              </p>
            )}
            {progress.strategyGenerated && (
              <p className="text-xs text-primary">
                Get today's focus →
              </p>
            )}
          </button>
        </div>

        {/* Weekly Coaching Note */}
        <div className="chamfer bg-muted/50 p-5">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">
                Weekly Coaching
              </p>
              <p className="text-sm text-muted-foreground">
                {progress.strategyGenerated
                  ? "Your personalized tasks are ready. Check your weekly execution plan for this week's priorities."
                  : allAssessmentsComplete
                    ? "Generate your career strategy to unlock weekly coaching and task recommendations."
                    : "Complete your assessments to unlock weekly coaching and task recommendations."
                }
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Assessment Item Component
function AssessmentItem({ 
  title, 
  description, 
  completed, 
  onClick 
}: { 
  title: string; 
  description: string; 
  completed: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 chamfer-sm bg-muted/50 hover:bg-muted transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
        )}
        <div>
          <p className="font-medium text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
