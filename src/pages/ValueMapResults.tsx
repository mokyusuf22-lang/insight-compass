import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { coreValues, categoryLabels, getValueInsights } from '@/data/valueMapData';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RotateCcw, Home } from 'lucide-react';

export default function ValueMapResults() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [rankedValues, setRankedValues] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user || !assessmentId) return;
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('value_map_assessments' as any)
          .select('*')
          .eq('id', assessmentId)
          .single();
        if (data) {
          const d = data as any;
          setRankedValues(d.ranked_values || []);
          setSelectedValues(d.selected_values || []);
        }
      } catch (err) {
        console.error('Error loading results:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) load();
  }, [user, authLoading, assessmentId]);

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (rankedValues.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No results found.</p>
        <Button onClick={() => navigate('/assessment/value-map')}>Take Assessment</Button>
      </div>
    );
  }

  const insights = getValueInsights(rankedValues);
  const droppedValues = selectedValues.filter(v => !rankedValues.includes(v));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <span className="text-5xl mb-3 block">🧭</span>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Your Value Map</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              These are the values that define your authentic self and guide your decisions.
            </p>
          </div>

          {/* Archetype Card */}
          <Card className="animate-fade-up border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Badge className="mb-3" variant="secondary">Your Archetype</Badge>
              <h2 className="text-2xl font-serif mb-3">{insights.archetype}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{insights.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {insights.strengths.map(s => (
                      <li key={s} className="text-sm flex items-center gap-2">
                        <span className="text-primary">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">Watch Out For</p>
                  <ul className="space-y-1">
                    {insights.watchOuts.map(w => (
                      <li key={w} className="text-sm flex items-center gap-2">
                        <span className="text-destructive">!</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranked Values */}
          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Your Top 5 Values (Ranked)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedValues.map((id, index) => {
                const value = coreValues.find(v => v.id === id);
                if (!value) return null;
                return (
                  <div key={id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-2xl">{value.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{value.name}</p>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize hidden md:inline-flex">
                      {value.category}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Values You Let Go */}
          {droppedValues.length > 0 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Values You Considered</CardTitle>
                <p className="text-sm text-muted-foreground">These values resonate with you but didn't make the top 5 — and that's revealing too.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {droppedValues.map(id => {
                    const value = coreValues.find(v => v.id === id);
                    if (!value) return null;
                    return (
                      <Badge key={id} variant="outline" className="text-sm py-1 px-3">
                        {value.emoji} {value.name}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reflection Prompt */}
          <Card className="animate-fade-up bg-accent/10 border-accent/20">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg mb-3">💭 Reflection</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Your #1 value, <strong>{coreValues.find(v => v.id === rankedValues[0])?.name}</strong>, is your non-negotiable — the lens through which you evaluate everything.</p>
                <p>When you feel stuck or conflicted, ask: <em>"Am I honoring my top values in this situation?"</em></p>
                <p>Values aren't static. Revisit this assessment periodically as you grow and your priorities evolve.</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" onClick={() => navigate('/assessment/value-map')}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retake Assessment
            </Button>
            <Button onClick={() => navigate('/welcome')}>
              <Home className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
