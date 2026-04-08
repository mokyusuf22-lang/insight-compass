import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { setLocalProgress } from '@/components/RequireStep';
import { blobPositions } from '@/data/blobTreeData';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import blobTreeImage from '@/assets/blob-tree.png';

type Step = 'intro' | 'current' | 'desired' | 'saving';

export default function BlobTreeAssessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('intro');
  const [currentBlob, setCurrentBlob] = useState<number | null>(null);
  const [desiredBlob, setDesiredBlob] = useState<number | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      navigate('/auth', { state: { from: '/assessment/blob-tree' } });
      return;
    }

    const init = async () => {
      setIsLoading(true);
      try {
        const { data: existing } = await supabase
          .from('blob_tree_assessments' as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setAssessmentId((existing as any).id);
          if ((existing as any).current_blob) {
            setCurrentBlob((existing as any).current_blob);
            setStep('desired');
          }
        } else {
          const { data: created, error } = await supabase
            .from('blob_tree_assessments' as any)
            .insert({ user_id: user.id } as any)
            .select()
            .single();
          if (error) throw error;
          setAssessmentId((created as any).id);
        }
      } catch (err) {
        console.error('Error initializing blob tree:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user, authLoading]);
  const handleBlobClick = async (num: number) => {
    if (step === 'current') {
      setCurrentBlob(num);
      // Save progress
      if (assessmentId) {
        await supabase
          .from('blob_tree_assessments' as any)
          .update({ current_blob: num } as any)
          .eq('id', assessmentId);
      }
      setStep('desired');
    } else if (step === 'desired') {
      setDesiredBlob(num);
      setStep('saving');
      // Complete assessment
      if (assessmentId) {
        await supabase
          .from('blob_tree_assessments' as any)
          .update({ desired_blob: num, is_complete: true } as any)
          .eq('id', assessmentId);
        // Set flow progress flag
        if (user) {
          await supabase
            .from('profiles')
            .update({ blob_tree_complete: true } as any)
            .eq('user_id', user.id);
        }
        setLocalProgress('blob_tree_complete', true);
      }
      navigate(`/assessment/blob-tree/results?id=${assessmentId}`);
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8 text-center">
              <span className="text-5xl mb-4 block">🌳</span>
              <h1 className="text-3xl md:text-4xl font-serif mb-4">The Blob Tree</h1>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto">
                The Blob Tree features 21 figures on and around a tree, each representing different
                emotions and states of being. This assessment helps you understand where you are
                emotionally right now — and where you'd like to be.
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <p className="text-sm">Look at the tree and choose the person that <strong>best represents you right now</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <p className="text-sm">Then choose the person you <strong>would like to be in the future</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <p className="text-sm">Discover what your choices <strong>reveal about your personality</strong></p>
                </div>
              </div>
              <Button size="lg" onClick={() => setStep('current')} className="rounded-full px-8">
                Begin <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isCurrentStep = step === 'current';
  const selectedOnThisStep = isCurrentStep ? currentBlob : desiredBlob;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />

      {/* Step indicator */}
      <div className="px-4 pt-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {isCurrentStep ? '1' : '2'} of 2</span>
            <span>{isCurrentStep ? '0%' : '50%'} complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: isCurrentStep ? '0%' : '50%' }}
            />
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Instruction */}
          <div className="text-center mb-6 animate-fade-up">
            <h2 className="text-xl md:text-2xl font-serif mb-2">
              {isCurrentStep
                ? 'Which person best represents you right now?'
                : 'Which person would you like to be in the future?'}
            </h2>
            <p className="text-muted-foreground text-sm">
              Tap on a numbered figure on the tree to select
            </p>
          </div>

          {/* Tree with clickable blobs */}
          <Card className="mb-6">
            <CardContent className="p-2 md:p-4">
              <div className="relative w-full" style={{ maxWidth: 600, margin: '0 auto' }}>
                <img
                  src={blobTreeImage}
                  alt="Blob Tree with 21 numbered figures"
                  className="w-full h-auto"
                />
                {/* Clickable overlays */}
                {Object.entries(blobPositions).map(([numStr, pos]) => {
                  const num = parseInt(numStr);
                  const isSelected = selectedOnThisStep === num;
                  const isPreviouslySelected = !isCurrentStep && currentBlob === num;

                  return (
                    <button
                      key={num}
                      onClick={() => handleBlobClick(num)}
                      className={`absolute w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 -translate-x-1/2 -translate-y-1/2 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground scale-125 shadow-lg ring-2 ring-primary ring-offset-2'
                          : isPreviouslySelected
                            ? 'bg-accent/80 text-accent-foreground scale-110 ring-1 ring-accent'
                            : 'bg-background/80 text-foreground hover:bg-primary/20 hover:scale-110 border border-border shadow-sm'
                      }`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      title={`Person ${num}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selection feedback & actions */}
          <div className="flex justify-between items-center">
            {!isCurrentStep && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('current');
                  setDesiredBlob(null);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Change first choice
              </Button>
            )}
            {isCurrentStep && <div />}

            {selectedOnThisStep && isCurrentStep && (
              <Button onClick={() => setStep('desired')}>
                Next: Choose your future self
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
