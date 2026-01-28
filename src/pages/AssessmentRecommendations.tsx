import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Sparkles, Target, Heart, Brain, Zap, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssessmentRecommendation {
  assessment_id: string;
  name: string;
  relevance_score: number;
  reason: string;
  key_insight: string;
}

interface RecommendationsResponse {
  recommendations: AssessmentRecommendation[];
  priority_focus: string;
}

const assessmentIcons: Record<string, React.ReactNode> = {
  wheel_of_life: <Target className="w-5 h-5" />,
  values_clarification: <Heart className="w-5 h-5" />,
  skills_gap: <BarChart3 className="w-5 h-5" />,
  emotional_intelligence: <Brain className="w-5 h-5" />,
  energy_audit: <Zap className="w-5 h-5" />,
  limiting_beliefs: <Shield className="w-5 h-5" />,
};

const assessmentColors: Record<string, string> = {
  wheel_of_life: 'bg-emerald-500/10 text-emerald-600',
  values_clarification: 'bg-rose-500/10 text-rose-600',
  skills_gap: 'bg-blue-500/10 text-blue-600',
  emotional_intelligence: 'bg-purple-500/10 text-purple-600',
  energy_audit: 'bg-amber-500/10 text-amber-600',
  limiting_beliefs: 'bg-slate-500/10 text-slate-600',
};

export default function AssessmentRecommendations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Gather data from localStorage
      const onboardingData = localStorage.getItem('onboarding_data');
      const goalsData = localStorage.getItem('goals_reality_data');
      const personalityHypothesis = localStorage.getItem('initial_assessment_results');

      const parsedOnboarding = onboardingData ? JSON.parse(onboardingData) : null;
      const parsedGoals = goalsData ? JSON.parse(goalsData) : null;
      const parsedPersonality = personalityHypothesis ? JSON.parse(personalityHypothesis) : null;

      // Convert goals format if needed
      const formattedGoals = parsedGoals ? {
        life_goals: parsedGoals.lifeGoals,
        career_goals: parsedGoals.careerGoals,
        challenges: parsedGoals.challenges,
      } : null;

      const { data, error: fnError } = await supabase.functions.invoke('recommend-assessments', {
        body: {
          onboarding_data: parsedOnboarding,
          goals_data: formattedGoals,
          personality_hypothesis: parsedPersonality,
        },
      });

      if (fnError) throw fnError;

      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to generate recommendations. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate assessment recommendations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAssessment = (assessmentId: string) => {
    // For now, navigate to welcome with a toast indicating future availability
    toast({
      title: 'Coming Soon',
      description: `The ${assessmentId.replace(/_/g, ' ')} assessment will be available soon!`,
    });
  };

  const handleContinue = () => {
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/goals-reality')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-serif text-lg font-medium">Your Recommendations</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Introduction */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-3">
            Personalised Assessment Path
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Based on your goals and challenges, we've identified assessments that will provide the most valuable insights for your journey.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchRecommendations} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : recommendations ? (
          <div className="space-y-6 animate-fade-up">
            {/* Priority Focus */}
            {recommendations.priority_focus && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Your Priority Focus</h3>
                      <p className="text-sm text-muted-foreground">{recommendations.priority_focus}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations.recommendations.map((rec, index) => (
              <Card 
                key={rec.assessment_id} 
                className="border-border/50 hover:border-primary/30 transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${assessmentColors[rec.assessment_id] || 'bg-primary/10 text-primary'}`}>
                        {assessmentIcons[rec.assessment_id] || <Sparkles className="w-5 h-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rec.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {rec.relevance_score}% match
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Why this matters for you:</p>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground mb-1">What you'll discover:</p>
                    <p className="text-sm text-muted-foreground">{rec.key_insight}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStartAssessment(rec.assessment_id)}
                  >
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Continue Button */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full gradient-primary text-primary-foreground hover:opacity-90"
          >
            Continue to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            You can complete these assessments at any time from your dashboard.
          </p>
        </div>
      </main>
    </div>
  );
}
