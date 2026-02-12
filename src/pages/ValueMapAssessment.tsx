import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { setLocalProgress } from '@/components/RequireStep';
import { coreValues, categoryLabels, categoryColors, type CoreValue } from '@/data/valueMapData';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Check, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 'intro' | 'select' | 'narrow' | 'rank' | 'saving';

export default function ValueMapAssessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('intro');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [topFive, setTopFive] = useState<string[]>([]);
  const [rankedValues, setRankedValues] = useState<string[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<CoreValue['category'] | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data: existing } = await supabase
          .from('value_map_assessments' as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          const e = existing as any;
          setAssessmentId(e.id);
          const sv = e.selected_values || [];
          const tf = e.top_five || [];
          if (tf.length > 0) {
            setSelectedValues(sv);
            setTopFive(tf);
            setRankedValues(tf);
            setStep('rank');
          } else if (sv.length > 0) {
            setSelectedValues(sv);
            setStep('narrow');
          }
        } else {
          const { data: created, error } = await supabase
            .from('value_map_assessments' as any)
            .insert({ user_id: user.id } as any)
            .select()
            .single();
          if (error) throw error;
          setAssessmentId((created as any).id);
        }
      } catch (err) {
        console.error('Error initializing value map:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) init();
  }, [user, authLoading]);

  const toggleValue = (id: string) => {
    if (step === 'select') {
      setSelectedValues(prev =>
        prev.includes(id) ? prev.filter(v => v !== id) : prev.length < 10 ? [...prev, id] : prev
      );
    } else if (step === 'narrow') {
      setTopFive(prev =>
        prev.includes(id) ? prev.filter(v => v !== id) : prev.length < 5 ? [...prev, id] : prev
      );
    }
  };

  const saveProgress = async (data: Record<string, any>) => {
    if (!assessmentId) return;
    await supabase
      .from('value_map_assessments' as any)
      .update(data as any)
      .eq('id', assessmentId);
  };

  const handleNextFromSelect = async () => {
    if (selectedValues.length < 8) {
      toast({ title: 'Select at least 8 values', description: 'Choose 8-10 values that resonate with you.', variant: 'destructive' });
      return;
    }
    await saveProgress({ selected_values: selectedValues });
    setStep('narrow');
  };

  const handleNextFromNarrow = async () => {
    if (topFive.length !== 5) {
      toast({ title: 'Select exactly 5 values', description: 'Narrow down to your 5 most important values.', variant: 'destructive' });
      return;
    }
    await saveProgress({ top_five: topFive });
    setRankedValues([...topFive]);
    setStep('rank');
  };

  const moveRank = (index: number, direction: 'up' | 'down') => {
    const newRanked = [...rankedValues];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newRanked.length) return;
    [newRanked[index], newRanked[target]] = [newRanked[target], newRanked[index]];
    setRankedValues(newRanked);
  };

  const handleComplete = async () => {
    setStep('saving');
    await saveProgress({ ranked_values: rankedValues, is_complete: true });
    // Set flow progress flag
    if (user) {
      await supabase
        .from('profiles')
        .update({ value_map_complete: true } as any)
        .eq('user_id', user.id);
    }
    setLocalProgress('value_map_complete', true);
    navigate(`/assessment/value-map/results?id=${assessmentId}`);
  };

  if (authLoading || isLoading) return <LoadingSpinner />;

  const progressPercent = step === 'intro' ? 0 : step === 'select' ? 15 : step === 'narrow' ? 50 : 80;
  const stepNum = step === 'select' ? 1 : step === 'narrow' ? 2 : step === 'rank' ? 3 : 0;

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8 text-center">
              <span className="text-5xl mb-4 block">🧭</span>
              <h1 className="text-3xl md:text-4xl font-serif mb-4">Value Map</h1>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto">
                Your values are the compass that guides every decision. This assessment helps you
                identify, clarify, and prioritize the values that matter most to you — revealing
                the foundation of your authentic self.
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <p className="text-sm">Select <strong>8-10 values</strong> that resonate with you</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <p className="text-sm">Narrow down to your <strong>top 5</strong> non-negotiables</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <p className="text-sm">Rank them in order of <strong>personal importance</strong></p>
                </div>
              </div>
              <Button size="lg" onClick={() => setStep('select')} className="rounded-full px-8">
                Begin <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const filteredValues = filterCategory === 'all'
    ? coreValues
    : coreValues.filter(v => v.category === filterCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {stepNum} of 3</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Step: Select 8-10 */}
          {step === 'select' && (
            <div className="animate-fade-up">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-serif mb-2">Which values resonate with you?</h2>
                <p className="text-muted-foreground text-sm">
                  Select <strong>8-10 values</strong> that feel important. ({selectedValues.length}/10 selected)
                </p>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                >
                  All
                </Button>
                {(Object.keys(categoryLabels) as CoreValue['category'][]).map(cat => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                  >
                    {categoryLabels[cat]}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {filteredValues.map(value => {
                  const isSelected = selectedValues.includes(value.id);
                  return (
                    <button
                      key={value.id}
                      onClick={() => toggleValue(value.id)}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-sm'
                          : 'bg-card border-border hover:border-primary/40 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{value.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{value.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{value.description}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNextFromSelect} disabled={selectedValues.length < 8}>
                  Narrow Down <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Narrow to 5 */}
          {step === 'narrow' && (
            <div className="animate-fade-up">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-serif mb-2">Now pick your top 5</h2>
                <p className="text-muted-foreground text-sm">
                  If you could only keep 5 values, which would they be? ({topFive.length}/5 selected)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {selectedValues.map(id => {
                  const value = coreValues.find(v => v.id === id)!;
                  const isSelected = topFive.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleValue(id)}
                      className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-md scale-[1.02]'
                          : 'bg-card border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{value.emoji}</span>
                        <p className="font-semibold text-sm">{value.name}</p>
                        {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{value.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('select')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNextFromNarrow} disabled={topFive.length !== 5}>
                  Rank Values <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Rank */}
          {step === 'rank' && (
            <div className="animate-fade-up">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-serif mb-2">Rank your values</h2>
                <p className="text-muted-foreground text-sm">
                  Use the arrows to order from most important (#1) to least important (#5)
                </p>
              </div>

              <Card className="mb-6">
                <CardContent className="p-4 space-y-2">
                  {rankedValues.map((id, index) => {
                    const value = coreValues.find(v => v.id === id)!;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-lg">{value.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{value.name}</p>
                          <p className="text-xs text-muted-foreground">{value.description}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveRank(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowLeft className="w-3 h-3 rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveRank(index, 'down')}
                            disabled={index === rankedValues.length - 1}
                          >
                            <ArrowRight className="w-3 h-3 rotate-90" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('narrow')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleComplete}>
                  See My Value Map <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
