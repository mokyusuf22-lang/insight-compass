import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/assessment/QuestionCard';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { freeQuestions } from '@/data/assessmentQuestions';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FreeAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Load existing responses
    const loadResponses = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('assessment_responses')
        .select('question_id, answer')
        .eq('user_id', user.id)
        .eq('is_paid_question', false);

      if (data) {
        const existingResponses: Record<string, string> = {};
        data.forEach((r) => {
          existingResponses[r.question_id] = r.answer;
        });
        setResponses(existingResponses);
      }
    };

    loadResponses();
  }, [user]);

  const handleSelect = async (value: string) => {
    const question = freeQuestions[currentQuestion];
    const newResponses = { ...responses, [question.id]: value };
    setResponses(newResponses);

    // Save response to database
    if (user) {
      setIsSaving(true);
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          user_id: user.id,
          question_id: question.id,
          answer: value,
          is_paid_question: false,
        }, {
          onConflict: 'user_id,question_id',
        });

      if (error) {
        toast({
          title: 'Error saving response',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
      setIsSaving(false);
    }
  };

  const goNext = () => {
    if (currentQuestion < freeQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Completed free assessment
      navigate('/email-capture');
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      navigate('/welcome');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading assessment..." />
      </div>
    );
  }

  const question = freeQuestions[currentQuestion];
  const hasAnswer = !!responses[question.id];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold">Free Assessment</span>
          </div>
          {isSaving && (
            <span className="text-sm text-muted-foreground animate-pulse-soft">
              Saving...
            </span>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="container max-w-3xl py-6 px-4">
        <ProgressBar current={currentQuestion + 1} total={freeQuestions.length} />
      </div>

      {/* Question */}
      <main className="flex-1 container max-w-3xl px-4 pb-8">
        <QuestionCard
          question={question.question}
          options={question.options}
          selectedValue={responses[question.id]}
          onSelect={handleSelect}
        />
      </main>

      {/* Navigation */}
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
            {currentQuestion === freeQuestions.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
