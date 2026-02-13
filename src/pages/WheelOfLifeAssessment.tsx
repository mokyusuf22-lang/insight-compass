import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { wheelCategories } from '@/data/wheelOfLifeCategories';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WheelOfLifeAssessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    wheelCategories.forEach((c) => (initial[c.id] = 5));
    return initial;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const total = wheelCategories.length;
  const category = wheelCategories[currentIndex];

  // Load or create assessment
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data: existing } = await supabase
          .from('wheel_of_life_assessments' as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setAssessmentId((existing as any).id);
          const savedScores = (existing as any).scores as Record<string, number>;
          if (savedScores && Object.keys(savedScores).length > 0) {
            setScores((prev) => ({ ...prev, ...savedScores }));
          }
        } else {
          const { data: created, error } = await supabase
            .from('wheel_of_life_assessments' as any)
            .insert({ user_id: user.id } as any)
            .select()
            .single();
          if (error) throw error;
          setAssessmentId((created as any).id);
        }
      } catch (err) {
        console.error('Error initializing WoL assessment:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) init();
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const handleScoreChange = (value: number[]) => {
    setScores((prev) => ({ ...prev, [category.id]: value[0] }));
  };

  const saveAndContinue = async () => {
    if (!assessmentId) return;
    setIsSaving(true);
    try {
      if (currentIndex < total - 1) {
        await supabase
          .from('wheel_of_life_assessments' as any)
          .update({ scores } as any)
          .eq('id', assessmentId);
        setCurrentIndex(currentIndex + 1);
      } else {
        // Complete
        await supabase
          .from('wheel_of_life_assessments' as any)
          .update({ scores, is_complete: true } as any)
          .eq('id', assessmentId);
        // Set progress flag
        if (user) {
          await supabase.from('profiles').update({ wheel_of_life_complete: true }).eq('user_id', user.id);
        }
        navigate(`/assessment/wheel-of-life/results?id=${assessmentId}`);
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast({ title: 'Error', description: 'Failed to save. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;

  const score = scores[category.id];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />

      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Category {currentIndex + 1} of {total}</span>
            <span>{Math.round(((currentIndex) / total) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex) / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8 animate-fade-up">
              <span className="text-5xl mb-4 block">{category.icon}</span>
              <h2 className="text-2xl md:text-3xl font-serif mb-2">{category.name}</h2>
              <p className="text-muted-foreground">{category.description}</p>
            </div>

            <div className="space-y-8">
              <div className="text-center">
                <span className="text-6xl font-serif font-bold text-primary">{score}</span>
                <p className="text-sm text-muted-foreground mt-2">
                  {score <= 3 ? 'Needs attention' : score <= 6 ? 'Room for growth' : score <= 8 ? 'Going well' : 'Thriving'}
                </p>
              </div>

              <div className="px-4">
                <Slider
                  value={[score]}
                  onValueChange={handleScoreChange}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 — Very unsatisfied</span>
                  <span>10 — Fully satisfied</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-10">
              <Button
                variant="ghost"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}

              <Button onClick={saveAndContinue} disabled={isSaving}>
                {currentIndex < total - 1 ? (
                  <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                ) : (
                  <>Complete <Check className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
