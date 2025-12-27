import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Target, 
  Lightbulb,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Zap
} from 'lucide-react';

interface CoachingOutput {
  focus: string;
  rationale: string;
  action: string;
  success_metric: string;
}

interface RoadmapPhase {
  phase: string;
  duration_months: string;
  focus: string;
}

interface CareerStrategy {
  success_likelihood: string;
  estimated_timeline_months: number;
  insight: string;
  roadmap: RoadmapPhase[];
  execution_rules: string[];
  risk_factors: string[];
}

export default function Coaching() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [coaching, setCoaching] = useState<CoachingOutput | null>(null);
  const [strategy, setStrategy] = useState<CareerStrategy | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profileData, setProfileData] = useState<{
    mbti: any;
    disc: any;
    strengths: any;
  } | null>(null);

  // Redirect if not authenticated or not paid
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!profile?.has_paid) {
        navigate('/paywall');
      }
    }
  }, [user, profile, loading, navigate]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Load strategy
        const { data: strategyData } = await supabase
          .from('career_strategies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (strategyData?.strategy) {
          setStrategy(strategyData.strategy as unknown as CareerStrategy);
          setProfileData({
            mbti: strategyData.mbti_result,
            disc: strategyData.disc_result,
            strengths: strategyData.strengths_result,
          });
        } else {
          // No strategy yet, redirect to strategy page
          navigate('/strategy');
          return;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, navigate]);

  const generateCoaching = async () => {
    if (!profileData || !strategy) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-coaching', {
        body: {
          mbti_result: profileData.mbti,
          disc_result: profileData.disc,
          strengths_result: profileData.strengths,
          career_strategy: strategy,
          current_phase: currentPhase,
        },
      });

      if (error) throw error;

      if (data?.coaching) {
        setCoaching(data.coaching);
        toast.success('Coaching guidance generated!');
      }
    } catch (error: any) {
      console.error('Error generating coaching:', error);
      if (error.message?.includes('429') || error.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.status === 402) {
        toast.error('Please add credits to continue using AI features.');
      } else {
        toast.error('Failed to generate coaching');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading coaching..." />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container max-w-3xl py-8 px-4 md:px-8">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-muted mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Personal Coaching
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Generate your career strategy first to unlock personalized coaching.
            </p>
            <Button onClick={() => navigate('/strategy')} className="rounded-full">
              Generate Strategy First
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const currentPhaseData = strategy.roadmap[currentPhase];

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Personal Coaching
          </h1>
          <p className="text-muted-foreground">
            Actionable guidance tailored to your personality
          </p>
        </div>

        {/* Current Phase Selection */}
        <Card className="mb-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Current Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {strategy.roadmap.map((phase, index) => (
                <Button
                  key={index}
                  variant={currentPhase === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPhase(index)}
                >
                  {index + 1}. {phase.phase}
                </Button>
              ))}
            </div>
            {currentPhaseData && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Months {currentPhaseData.duration_months}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentPhaseData.focus}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        {!coaching && (
          <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <Button 
              size="lg" 
              onClick={generateCoaching}
              disabled={isGenerating}
              className="gradient-primary text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Get Today's Focus
                </>
              )}
            </Button>
          </div>
        )}

        {/* Coaching Output */}
        {coaching && (
          <>
            {/* Focus */}
            <Card className="mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{coaching.focus}</p>
              </CardContent>
            </Card>

            {/* Rationale */}
            <Card className="mb-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-secondary" />
                  Why This Fits You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{coaching.rationale}</p>
              </CardContent>
            </Card>

            {/* Action */}
            <Card className="mb-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowRight className="w-5 h-5 text-green-500" />
                  Action to Take
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="font-medium">{coaching.action}</p>
                </div>
              </CardContent>
            </Card>

            {/* Success Metric */}
            <Card className="mb-8 animate-fade-up" style={{ animationDelay: '250ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Success Metric
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{coaching.success_metric}</p>
              </CardContent>
            </Card>

            {/* Regenerate Button */}
            <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <Button 
                variant="outline"
                onClick={generateCoaching}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Get New Focus
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '350ms' }}>
          <Button 
            variant="outline"
            onClick={() => navigate('/strategy')}
          >
            View Full Strategy
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/history')}
          >
            Back to Journey
          </Button>
        </div>
      </main>
    </div>
  );
}
