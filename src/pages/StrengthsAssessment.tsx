import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { strengthsQuestions, answerOptions } from '@/data/strengthsQuestions';
import { calculateStrengthsResult, StrengthsResponse } from '@/lib/strengthsScoring';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

export default function StrengthsAssessment() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responses, setResponses] = useState<StrengthsResponse[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const totalQuestions = strengthsQuestions.length;

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

  // Load existing assessment or create new one
  useEffect(() => {
    const loadOrCreateAssessment = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Check for existing incomplete assessment
        const { data: existing, error } = await supabase
          .from('strengths_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', false)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (existing) {
          setAssessmentId(existing.id);
          setCurrentQuestion(existing.current_question);
          const existingResponses = existing.responses as unknown as StrengthsResponse[];
          setResponses(Array.isArray(existingResponses) ? existingResponses : []);
        } else {
          // Create new assessment
          const { data: newAssessment, error: createError } = await supabase
            .from('strengths_assessments')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          setAssessmentId(newAssessment.id);
        }
      } catch (error) {
        console.error('Error loading assessment:', error);
        toast.error('Failed to load assessment');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && profile?.has_paid) {
      loadOrCreateAssessment();
    }
  }, [user, profile]);

  // Save progress to database
  const saveProgress = useCallback(async (
    questionNum: number, 
    allResponses: StrengthsResponse[],
    isComplete: boolean = false
  ) => {
    if (!assessmentId) return;
    
    setIsSaving(true);
    
    try {
      const updateData: {
        current_question: number;
        responses: Json;
        is_complete: boolean;
        result?: Json;
      } = {
        current_question: questionNum,
        responses: allResponses as unknown as Json,
        is_complete: isComplete,
      };

      if (isComplete) {
        const result = calculateStrengthsResult(allResponses);
        updateData.result = result as unknown as Json;
      }

      const { error } = await supabase
        .from('strengths_assessments')
        .update(updateData)
        .eq('id', assessmentId);

      if (error) throw error;

      if (isComplete) {
        // Update profile
        await supabase
          .from('profiles')
          .update({ strengths_completed: true })
          .eq('user_id', user!.id);

        toast.success('Assessment complete!');
        navigate(`/assessment/strengths/results?id=${assessmentId}`);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  }, [assessmentId, user, navigate]);

  const handleAnswer = async (value: number) => {
    const question = strengthsQuestions[currentQuestion - 1];
    
    // Update responses
    const newResponses = [...responses];
    const existingIndex = newResponses.findIndex(r => r.questionId === question.id);
    
    if (existingIndex >= 0) {
      newResponses[existingIndex] = { questionId: question.id, value };
    } else {
      newResponses.push({ questionId: question.id, value });
    }
    
    setResponses(newResponses);

    // Check if this is the last question
    if (currentQuestion >= totalQuestions) {
      await saveProgress(currentQuestion, newResponses, true);
    } else {
      // Move to next question and save progress
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      await saveProgress(nextQuestion, newResponses);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getCurrentAnswer = (): number | undefined => {
    const question = strengthsQuestions[currentQuestion - 1];
    const response = responses.find(r => r.questionId === question.id);
    return response?.value;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading assessment..." />
      </div>
    );
  }

  const currentQuestionData = strengthsQuestions[currentQuestion - 1];
  const currentAnswer = getCurrentAnswer();

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-2xl py-8 px-4">
        {/* Progress */}
        <div className="mb-8 animate-fade-up">
          <ProgressBar 
            current={currentQuestion} 
            total={totalQuestions} 
          />
        </div>

        {/* Strength Domain Indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground animate-fade-up">
          <Sparkles className="w-4 h-4" />
          <span>{currentQuestionData.strength}</span>
        </div>

        {/* Question Card */}
        <Card className="mb-8 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <CardContent className="p-8">
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground leading-relaxed">
              {currentQuestionData.text}
            </h2>
          </CardContent>
        </Card>

        {/* Answer Options */}
        <div className="space-y-3 mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
          {answerOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentAnswer === option.value ? 'default' : 'outline'}
              className={`w-full justify-start text-left h-auto py-4 px-6 ${
                currentAnswer === option.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleAnswer(option.value)}
              disabled={isSaving}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center animate-fade-up" style={{ animationDelay: '150ms' }}>
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentQuestion === 1 || isSaving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {isSaving && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}

          <div className="text-sm text-muted-foreground">
            {currentQuestion} / {totalQuestions}
          </div>
        </div>
      </main>
    </div>
  );
}
