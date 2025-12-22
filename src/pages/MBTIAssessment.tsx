import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserHeader } from '@/components/UserHeader';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { mbtiQuestions, mbtiAnswerOptions } from '@/data/mbtiQuestions';
import { calculateMBTIResult } from '@/lib/mbtiScoring';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface StoredResponse {
  questionId: number;
  answer: string;
}

export default function MBTIAssessment() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalQuestions = mbtiQuestions.length;
  const question = mbtiQuestions[currentQuestion - 1];
  const currentAnswer = responses[currentQuestion];
  const progress = (Object.keys(responses).length / totalQuestions) * 100;

  // Load or create assessment
  useEffect(() => {
    const initializeAssessment = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Check for existing incomplete assessment
        const { data: existing, error: fetchError } = await supabase
          .from('mbti_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          setAssessmentId(existing.id);
          setCurrentQuestion(existing.current_question || 1);
          
          // Parse stored responses
          const storedResponses = (existing.responses as unknown as StoredResponse[]) || [];
          const responsesMap: Record<number, string> = {};
          if (Array.isArray(storedResponses)) {
            storedResponses.forEach(r => {
              responsesMap[r.questionId] = r.answer;
            });
          }
          setResponses(responsesMap);
        } else {
          // Create new assessment
          const { data: newAssessment, error: createError } = await supabase
            .from('mbti_assessments')
            .insert({
              user_id: user.id,
              current_question: 1,
              responses: [],
            })
            .select()
            .single();

          if (createError) throw createError;
          setAssessmentId(newAssessment.id);
        }
      } catch (error) {
        console.error('Error initializing assessment:', error);
        toast.error('Failed to load assessment');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      initializeAssessment();
    }
  }, [user, authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect if not paid (premium feature)
  useEffect(() => {
    if (!authLoading && profile && !profile.has_paid) {
      navigate('/paywall');
    }
  }, [profile, authLoading, navigate]);

  // Auto-save with debounce
  const saveProgress = useCallback(async (newResponses: Record<number, string>, newCurrentQuestion: number) => {
    if (!assessmentId) return;
    
    setIsSaving(true);
    
    try {
      const responsesArray: StoredResponse[] = Object.entries(newResponses).map(([qId, answer]) => ({
        questionId: parseInt(qId),
        answer,
      }));

      await supabase
        .from('mbti_assessments')
        .update({
          responses: responsesArray as unknown as Json,
          current_question: newCurrentQuestion,
        })
        .eq('id', assessmentId);
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [assessmentId]);

  const handleSelect = (value: string) => {
    const newResponses = { ...responses, [currentQuestion]: value };
    setResponses(newResponses);
    saveProgress(newResponses, currentQuestion);
  };

  const goNext = async () => {
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      saveProgress(responses, nextQuestion);
    } else {
      // Complete the assessment
      await completeAssessment();
    }
  };

  const goBack = () => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      saveProgress(responses, prevQuestion);
    }
  };

  const completeAssessment = async () => {
    if (!assessmentId || !user) return;
    
    setIsCompleting(true);
    
    try {
      // Calculate results
      const responsesArray: StoredResponse[] = Object.entries(responses).map(([qId, answer]) => ({
        questionId: parseInt(qId),
        answer,
      }));
      
      const result = calculateMBTIResult(responsesArray);
      
      // Save completed assessment
      await supabase
        .from('mbti_assessments')
        .update({
          is_complete: true,
          responses: responsesArray as unknown as Json,
          result: result as unknown as Json,
        })
        .eq('id', assessmentId);

      // Update profile
      await supabase
        .from('profiles')
        .update({ mbti_completed: true })
        .eq('user_id', user.id);

      // Navigate to results
      navigate(`/assessment/mbti/results?id=${assessmentId}`);
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Failed to save results');
    } finally {
      setIsCompleting(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !profile) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader showHomeLink={true} />

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-end mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              {isSaving && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              )}
              {!isSaving && (
                <span className="text-primary">Progress saved</span>
              )}
            </span>
          </div>
          <ProgressBar current={currentQuestion} total={totalQuestions} />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center animate-fade-up">
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground text-center mb-8 leading-relaxed">
            {question.text}
          </h2>

          <div className="flex flex-col gap-3">
            {mbtiAnswerOptions.map((option) => {
              const isSelected = currentAnswer === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span className={cn(
                      "font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentQuestion === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={goNext}
            disabled={!currentAnswer || isCompleting}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : currentQuestion === totalQuestions ? (
              'Complete Assessment'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
