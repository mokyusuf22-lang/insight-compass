import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { GoalReview } from '@/components/GoalReview';
import { 
  Brain, 
  Target, 
  Zap, 
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Briefcase,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssessmentResult {
  mbtiType?: string;
  discProfile?: { primary: string; secondary?: string };
  topStrengths?: string[];
  step1Hypothesis?: {
    mbtiTendency?: string;
    confidence?: number;
  };
}

export default function Results() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<AssessmentResult>({});
  const [loadingResults, setLoadingResults] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      
      try {
        // Fetch Step1 assessment
        const { data: step1Data } = await supabase
          .from('step1_assessments')
          .select('ai_hypothesis')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .maybeSingle();

        // Fetch MBTI result
        const { data: mbtiData } = await supabase
          .from('mbti_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .maybeSingle();

        // Fetch DISC result
        const { data: discData } = await supabase
          .from('disc_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .maybeSingle();

        // Fetch Strengths result
        const { data: strengthsData } = await supabase
          .from('strengths_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .maybeSingle();

        const mbtiResult = mbtiData?.result as { type?: string; axisResults?: Record<string, { percentage: number }> } | null;
        const discResult = discData?.result as { primary?: string; secondary?: string; scores?: Record<string, number> } | null;
        const strengthsResult = strengthsData?.result as { ranked_strengths?: { name: string; score: number }[] } | null;
        const step1Hypothesis = step1Data?.ai_hypothesis as { mbtiTendency?: string; confidence?: number } | null;

        let count = 0;
        if (step1Data) count++;
        if (mbtiData) count++;
        if (discData) count++;
        if (strengthsData) count++;
        setCompletedCount(count);

        setResults({
          mbtiType: mbtiResult?.type,
          discProfile: discResult ? { primary: discResult.primary || '', secondary: discResult.secondary } : undefined,
          topStrengths: strengthsResult?.ranked_strengths?.slice(0, 5).map(s => s.name),
          step1Hypothesis: step1Hypothesis || undefined,
        });
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoadingResults(false);
        setTimeout(() => setAnimationReady(true), 100);
      }
    };

    fetchResults();
  }, [user]);

  if (loading || loadingResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your results..." />
      </div>
    );
  }

  const hasResults = completedCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-6xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Your Quick Assessment Result
          </h1>
          <p className="text-muted-foreground">
            {hasResults 
              ? `${completedCount} assessment${completedCount > 1 ? 's' : ''} completed`
              : 'Complete assessments to see your results'
            }
          </p>
        </div>

        {!hasResults ? (
          <div className="chamfer bg-card border border-border p-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No results yet</h2>
            <p className="text-muted-foreground mb-6">Start your assessment journey to see insights here.</p>
            <Button onClick={() => navigate('/assessment/step1')} className="rounded-full">
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <>
            {/* Bento Grid Layout with staggered animations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              
              {/* Hero Card - Personality Type */}
              <button 
                onClick={() => navigate('/assessment/mbti/results')}
                className={`md:col-span-2 lg:col-span-2 chamfer bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 md:p-10 relative overflow-hidden transition-all duration-700 hover:from-primary/30 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '0ms' }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <p className="text-primary text-sm font-medium mb-2">Your Personality Profile</p>
                
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6">
                  {results.mbtiType || results.step1Hypothesis?.mbtiTendency || '????'}
                </h2>
                
                <div className="chamfer-sm bg-background/80 backdrop-blur-sm p-4 max-w-md">
                  <p className="text-foreground text-sm">
                    {results.mbtiType 
                      ? "Your complete personality type based on 93 questions."
                      : results.step1Hypothesis?.mbtiTendency
                        ? "Preliminary type based on quick assessment. Complete full MBTI for accuracy."
                        : "Complete assessments to discover your type."
                    }
                  </p>
                </div>
              </button>

              {/* Design Persona Card */}
              <button 
                onClick={() => navigate('/assessment/disc/results')}
                className={`chamfer bg-card border border-border p-6 flex flex-col transition-all duration-700 hover:border-primary/50 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '100ms' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                    Design Persona
                  </span>
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-20 h-20 chamfer-sm bg-foreground flex items-center justify-center mb-4">
                    <Target className="w-10 h-10 text-background" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">You are a</p>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-2">
                    {results.discProfile?.primary || 'Strategist'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {results.discProfile 
                      ? `${results.discProfile.primary} with ${results.discProfile.secondary || 'balanced'} tendencies.`
                      : 'Complete DISC assessment to reveal your behavioral style.'
                    }
                  </p>
                </div>
              </button>

              {/* Assessments Completed */}
              <div 
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '150ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Total Assessments
                </p>
                <p className="text-5xl font-serif font-bold text-primary mb-4">
                  {completedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  of 4 assessments completed
                </p>
              </div>

              {/* Top Strengths */}
              <button 
                onClick={() => navigate('/assessment/strengths/results')}
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 hover:border-primary/50 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                  Top Strengths
                </p>
                
                {results.topStrengths && results.topStrengths.length > 0 ? (
                  <div className="space-y-3">
                    {results.topStrengths.slice(0, 3).map((strength, index) => (
                      <div key={strength} className="flex items-center gap-3">
                        <div className={`w-8 h-8 chamfer-sm flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-foreground font-medium">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm">Complete Strengths assessment</span>
                  </div>
                )}
              </button>

              {/* DISC Profile Bar */}
              <button 
                onClick={() => navigate('/assessment/disc/results')}
                className={`chamfer bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white transition-all duration-700 hover:from-amber-600 hover:to-orange-600 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '250ms' }}
              >
                <p className="text-xs uppercase tracking-wide opacity-80 mb-2">
                  Behavioral Style
                </p>
                <h3 className="text-3xl font-serif font-bold mb-2">
                  {results.discProfile?.primary || 'DISC'}
                </h3>
                <p className="text-sm opacity-90">
                  {results.discProfile 
                    ? 'Your dominant behavioral profile'
                    : 'Discover your DISC profile'
                  }
                </p>
              </button>

              {/* Confidence Score */}
              <div 
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Profile Confidence
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-serif font-bold text-foreground">
                    {results.step1Hypothesis?.confidence 
                      ? `${Math.round(results.step1Hypothesis.confidence * 100)}%`
                      : '—'
                    }
                  </span>
                </div>
                <div className="h-2 bg-muted chamfer-sm overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(results.step1Hypothesis?.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Team Dynamics */}
              <div 
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '350ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Team Dynamics
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {results.discProfile 
                    ? `As a ${results.discProfile.primary}, you excel in collaborative environments.`
                    : 'Complete DISC to understand your team role.'
                  }
                </p>
              </div>

              {/* Growth Potential */}
              <div 
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '400ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Growth Path
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {completedCount >= 4 
                    ? 'All assessments complete. View your full strategy.'
                    : `Complete ${4 - completedCount} more assessment${4 - completedCount > 1 ? 's' : ''} for personalized growth plan.`
                  }
                </p>
              </div>

            </div>

            {/* Career Goals Section - Editable */}
            <div 
              className={`chamfer bg-card p-6 mb-8 transition-all duration-700 ${
                animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '450ms' }}
            >
              <GoalReview showTitle={true} />
            </div>

            {/* CTA to continue */}
            {completedCount < 4 && (
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="rounded-full"
                  onClick={() => {
                    if (!results.mbtiType) navigate('/assessment/mbti');
                    else if (!results.discProfile) navigate('/assessment/disc');
                    else navigate('/assessment/strengths');
                  }}
                >
                  Continue to Next Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {completedCount >= 4 && (
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="rounded-full"
                  onClick={() => navigate('/strategy')}
                >
                  View Career Strategy
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
