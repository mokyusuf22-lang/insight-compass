import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { LikertQuestion } from '@/components/assessment/LikertQuestion';
import { CareerContextForm, CareerContext } from '@/components/assessment/CareerContextForm';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { step1Questions, calculateAxisScores, deriveMBTITendency } from '@/data/step1Questions';
import { ArrowLeft, ArrowRight, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Phase = 'questions' | 'career-context' | 'generating';

export default function Step1Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('questions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSelect = (value: string) => {
    const question = step1Questions[currentQuestion];
    setResponses({ ...responses, [question.id]: value });
  };

  const goNext = () => {
    if (currentQuestion < step1Questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, move to career context
      setPhase('career-context');
    }
  };

  const goBack = () => {
    if (phase === 'career-context') {
      setPhase('questions');
      setCurrentQuestion(step1Questions.length - 1);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      navigate('/welcome');
    }
  };

  const handleCareerSubmit = async (careerContext: CareerContext) => {
    if (!user) return;

    setIsSubmitting(true);
    setPhase('generating');

    try {
      // Calculate MBTI scores
      const axisScores = calculateAxisScores(responses);
      const derivedTendency = deriveMBTITendency(axisScores);

      console.log('Axis scores:', axisScores);
      console.log('Derived tendency:', derivedTendency);

      // Call AI to generate hypothesis
      const { data: hypothesis, error: aiError } = await supabase.functions.invoke('generate-hypothesis', {
        body: {
          axis_scores: axisScores,
          derived_tendency: derivedTendency,
          current_role: careerContext.currentRole,
          target_role: careerContext.targetRole,
          challenge: careerContext.biggestChallenge,
          timeline: careerContext.timeHorizon,
        },
      });

      if (aiError) {
        throw new Error(aiError.message || 'Failed to generate hypothesis');
      }

      console.log('AI hypothesis:', hypothesis);

      // Save to database - first check if record exists
      const { data: existing } = await supabase
        .from('step1_assessments')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let dbError;
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('step1_assessments')
          .update({
            axis_scores: JSON.parse(JSON.stringify(axisScores)) as Json,
            user_current_role: careerContext.currentRole,
            user_target_role: careerContext.targetRole,
            biggest_challenge: careerContext.biggestChallenge,
            time_horizon: careerContext.timeHorizon,
            ai_hypothesis: JSON.parse(JSON.stringify(hypothesis)) as Json,
            is_complete: true,
          })
          .eq('user_id', user.id);
        dbError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('step1_assessments')
          .insert([{
            user_id: user.id,
            axis_scores: JSON.parse(JSON.stringify(axisScores)) as Json,
            user_current_role: careerContext.currentRole,
            user_target_role: careerContext.targetRole,
            biggest_challenge: careerContext.biggestChallenge,
            time_horizon: careerContext.timeHorizon,
            ai_hypothesis: JSON.parse(JSON.stringify(hypothesis)) as Json,
            is_complete: true,
          }]);
        dbError = error;
      }

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save assessment');
      }

      // Update profile to mark step1 as completed
      await supabase
        .from('profiles')
        .update({ step1_completed: true })
        .eq('user_id', user.id);

      await refreshProfile();

      // Navigate to results
      navigate('/assessment/step1/results');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setPhase('career-context');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (phase === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-semibold mb-2">Analyzing Your Profile</h2>
          <p className="text-muted-foreground">Generating your initial personality hypothesis...</p>
        </div>
      </div>
    );
  }

  const question = step1Questions[currentQuestion];
  const hasAnswer = !!responses[question?.id];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold">Personality Assessment</span>
          </div>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Step 1 of 2
          </span>
        </div>
      </header>

      {/* Progress (only during questions) */}
      {phase === 'questions' && (
        <div className="container max-w-3xl py-6 px-4">
          <ProgressBar current={currentQuestion + 1} total={step1Questions.length} />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 container max-w-3xl px-4 py-8">
        {phase === 'questions' ? (
          <LikertQuestion
            question={question.question}
            selectedValue={responses[question.id]}
            onSelect={handleSelect}
          />
        ) : (
          <CareerContextForm
            onSubmit={handleCareerSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>

      {/* Navigation (only during questions) */}
      {phase === 'questions' && (
        <footer className="border-t border-border p-4 md:p-6 bg-card">
          <div className="container max-w-3xl flex justify-between">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={goNext}
              disabled={!hasAnswer}
              className={hasAnswer ? 'gradient-primary text-primary-foreground hover:opacity-90' : ''}
            >
              {currentQuestion === step1Questions.length - 1 ? 'Continue' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </footer>
      )}

      {/* Back button during career context */}
      {phase === 'career-context' && (
        <footer className="border-t border-border p-4 md:p-6 bg-card">
          <div className="container max-w-3xl">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
