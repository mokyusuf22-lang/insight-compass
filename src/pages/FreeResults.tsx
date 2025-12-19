import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ResultsPreview } from '@/components/assessment/ResultsPreview';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Crown, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';

export default function FreeResults() {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadResponses = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('assessment_responses')
        .select('question_id, answer')
        .eq('user_id', user.id)
        .eq('is_paid_question', false);

      if (data) {
        const loadedResponses: Record<string, string> = {};
        data.forEach((r) => {
          loadedResponses[r.question_id] = r.answer;
        });
        setResponses(loadedResponses);
      }
      setIsLoading(false);
    };

    if (user) {
      loadResponses();
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Analyzing your responses..." />
      </div>
    );
  }

  const hasPaid = profile?.has_paid;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold">Your Results</span>
          </div>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Preview
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-8 px-4 md:px-8">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-3">
            Your Personality Snapshot
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Based on your responses, here's a glimpse into your unique personality profile. 
            Unlock the full assessment for deeper insights.
          </p>
        </div>

        <ResultsPreview responses={responses} isFullResults={false} />

        {/* CTA Section */}
        <div className="mt-12 text-center animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-2xl p-8 border border-border">
            <Crown className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-semibold mb-3">
              Ready for the Full Picture?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Unlock 7 additional questions, detailed analysis, and personalized growth recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!hasPaid ? (
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground hover:opacity-90 px-8"
                  onClick={() => navigate('/paywall')}
                >
                  Unlock Full Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground hover:opacity-90 px-8"
                  onClick={() => navigate('/assessment/full')}
                >
                  Continue to Full Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/assessment/free')}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Free Assessment
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
