import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface AIHypothesis {
  mbti_tendency: string;
  traits: string[];
  summary: string;
  confidence: number;
}

export default function Step1Results() {
  const [hypothesis, setHypothesis] = useState<AIHypothesis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('step1_assessments')
        .select('ai_hypothesis')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error('Error loading results:', error);
        navigate('/assessment/step1');
        return;
      }

      const aiData = data.ai_hypothesis as unknown as AIHypothesis;
      setHypothesis(aiData);
      setIsLoading(false);
    };

    if (user) {
      loadResults();
    }
  }, [user, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your results..." />
      </div>
    );
  }

  if (!hypothesis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No results found.</p>
          <Button onClick={() => navigate('/assessment/step1')} className="rounded-full">
            Take Assessment
          </Button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    // Check if user has paid
    if (profile?.has_paid) {
      navigate('/assessment/full');
    } else {
      navigate('/paywall');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <UserHeader />

      {/* Content */}
      <main className="container max-w-4xl py-8 px-4 md:px-8">
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-16 h-16 chamfer bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-3">
            Initial Personality Hypothesis
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Based on your responses, here's our preliminary analysis of your personality tendencies.
          </p>
        </div>

        {/* MBTI Tendency Card */}
        <div className="chamfer bg-card p-6 md:p-8 text-center mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Likely Personality Type
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
            {hypothesis.mbti_tendency}
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Confidence:</span>
            <span className="font-medium text-foreground">
              {Math.round(hypothesis.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Traits */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <h3 className="text-lg font-semibold mb-4">Supporting Traits</h3>
          <div className="flex flex-wrap gap-3">
            {hypothesis.traits.map((trait, index) => (
              <span
                key={index}
                className="px-4 py-2 chamfer-sm bg-secondary text-secondary-foreground font-medium"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="chamfer bg-card p-6 mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold mb-3">Summary</h3>
          <p className="text-muted-foreground leading-relaxed">
            {hypothesis.summary}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="chamfer bg-muted/50 p-6 mb-8 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">This is an early hypothesis based on limited data.</strong>
                <br />
                We'll validate and refine this in the next step with a deeper assessment that explores 
                your personality dimensions in greater detail.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground hover:opacity-90 px-8 rounded-full"
            onClick={handleContinue}
          >
            Continue to Deep Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            {profile?.has_paid 
              ? "Let's dive deeper into your personality profile."
              : "Unlock the full assessment to validate and refine these insights."
            }
          </p>
        </div>
      </main>
    </div>
  );
}
