import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { discQuestions, answerOptions, DISCQuestion } from '@/data/discQuestions';
import { calculateDISCResult, DISCResponse } from '@/lib/discScoring';
import { UserHeader } from '@/components/UserHeader';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DISCAssessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responses, setResponses] = useState<DISCResponse[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const totalQuestions = discQuestions.length;

  // Load or create assessment
  useEffect(() => {
    const initAssessment = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Check for existing incomplete assessment
        const { data: existing, error: fetchError } = await supabase
          .from('disc_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          setAssessmentId(existing.id);
          setCurrentQuestion(existing.current_question);
          const typedResponses = existing.responses as unknown as DISCResponse[];
          setResponses(typedResponses || []);
        } else {
          // Create new assessment
          const { data: newAssessment, error: createError } = await supabase
            .from('disc_assessments')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          setAssessmentId(newAssessment.id);
        }
      } catch (error) {
        console.error('Error initializing assessment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assessment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      initAssessment();
    }
  }, [user, authLoading, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Save progress
  const saveProgress = useCallback(async (
    newResponses: DISCResponse[],
    questionNum: number,
    complete: boolean = false
  ) => {
    if (!assessmentId) return;
    
    setIsSaving(true);
    
    try {
      const updateData: any = {
        responses: newResponses,
        current_question: questionNum,
      };

      if (complete) {
        const result = calculateDISCResult(newResponses);
        updateData.is_complete = true;
        updateData.result = result;
      }

      const { error } = await supabase
        .from('disc_assessments')
        .update(updateData)
        .eq('id', assessmentId);

      if (error) throw error;

      if (complete) {
        // Update profile
        await supabase
          .from('profiles')
          .update({ disc_completed: true })
          .eq('user_id', user?.id);
          
        navigate(`/assessment/disc/results?id=${assessmentId}`);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save progress. Your answers are still recorded locally.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [assessmentId, user, navigate, toast]);

  const handleAnswer = (value: number) => {
    const question = discQuestions[currentQuestion - 1];
    
    // Update or add response
    const existingIndex = responses.findIndex(r => r.questionId === question.id);
    let newResponses: DISCResponse[];
    
    if (existingIndex >= 0) {
      newResponses = [...responses];
      newResponses[existingIndex] = { questionId: question.id, answer: value };
    } else {
      newResponses = [...responses, { questionId: question.id, answer: value }];
    }
    
    setResponses(newResponses);

    // Auto-advance or complete
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      saveProgress(newResponses, nextQuestion);
    } else {
      // Complete assessment
      saveProgress(newResponses, currentQuestion, true);
    }
  };

  const getCurrentResponse = (): number | null => {
    const question = discQuestions[currentQuestion - 1];
    const response = responses.find(r => r.questionId === question.id);
    return response?.answer || null;
  };

  const goBack = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  const question: DISCQuestion = discQuestions[currentQuestion - 1];
  const currentAnswer = getCurrentResponse();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />

      {/* Progress */}
      <div className="px-4 pt-4">
        <ProgressBar current={currentQuestion} total={totalQuestions} />
      </div>

      {/* Question */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion} of {totalQuestions}
              </span>
              <h2 className="text-xl md:text-2xl font-serif mt-2 leading-relaxed">
                {question.text}
              </h2>
            </div>

            {/* Answer options */}
            <div className="space-y-3">
              {answerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    currentAnswer === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={currentQuestion === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {isSaving && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}

              {currentAnswer && currentQuestion < totalQuestions && (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
