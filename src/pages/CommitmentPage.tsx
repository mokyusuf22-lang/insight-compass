import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const TIME_OPTIONS = [
  { value: '2-3 hours/week', label: '2–3 hrs/week', description: 'Light commitment, steady progress' },
  { value: '4-6 hours/week', label: '4–6 hrs/week', description: 'Moderate pace, visible results' },
  { value: '7-10 hours/week', label: '7–10 hrs/week', description: 'Serious commitment, fast progress' },
  { value: '10+ hours/week', label: '10+ hrs/week', description: 'All-in, maximum momentum' },
];

export default function CommitmentPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [timeBudget, setTimeBudget] = useState('');
  const [intent, setIntent] = useState('');
  const [constraints, setConstraints] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingCommitment, setExistingCommitment] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/commit' } });
    }
  }, [user, authLoading, navigate]);

  // Load selected path from location state or from DB
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      // Check location state first (coming from path-options)
      const stateData = location.state as any;
      if (stateData?.selectedPath) {
        setSelectedPath(stateData.selectedPath);
      }

      // Check for existing commitment
      const { data: commitment } = await supabase
        .from('path_commitments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (commitment) {
        setExistingCommitment(commitment);
        if (!stateData?.selectedPath && commitment.chosen_path) {
          setSelectedPath(commitment.chosen_path);
        }
        setTimeBudget(commitment.time_budget || '');
        setIntent(commitment.intent || '');
        setConstraints(commitment.constraints || '');
      }

      // If no path from state or commitment, fetch from recommendations
      if (!stateData?.selectedPath && !commitment?.chosen_path) {
        const { data: rec } = await supabase
          .from('path_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (rec && rec.selected_path_index !== null) {
          const recs = Array.isArray(rec.recommendations)
            ? rec.recommendations
            : (rec.recommendations as any)?.paths || [];
          if (recs[rec.selected_path_index]) {
            setSelectedPath(recs[rec.selected_path_index]);
          }
        }
      }

      setIsLoading(false);
    };

    if (!authLoading && user) load();
  }, [user, authLoading, location.state]);

  const handleSubmit = async () => {
    if (!user || !selectedPath) return;
    if (!timeBudget) {
      toast.error('Please select a time budget.');
      return;
    }
    if (!intent.trim()) {
      toast.error('Please write your intent statement.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        chosen_path: selectedPath as any,
        time_budget: timeBudget,
        intent: intent.trim(),
        constraints: constraints.trim() || null,
        focus_area: (selectedPath as any)?.title || null,
      };

      if (existingCommitment) {
        await supabase
          .from('path_commitments')
          .update(payload)
          .eq('id', existingCommitment.id);
      } else {
        const { data: created } = await supabase
          .from('path_commitments')
          .insert(payload)
          .select()
          .single();
        if (created) setExistingCommitment(created);
      }

      // Update profile flag
      await supabase
        .from('profiles')
        .update({ path_committed: true } as any)
        .eq('user_id', user.id);

      toast.success("Commitment saved! Let's build your path.");
      navigate('/welcome');
    } catch (err: any) {
      console.error('Error saving commitment:', err);
      toast.error(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;

  if (!selectedPath) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <span className="text-5xl mb-4 block">🛤️</span>
              <h2 className="text-2xl font-serif mb-3">No Path Selected</h2>
              <p className="text-muted-foreground mb-6">
                Please go back and select a path option first.
              </p>
              <Button onClick={() => navigate('/path-options')} className="rounded-full px-8">
                View Path Options
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <span className="text-5xl mb-3 block">🎯</span>
            <Badge variant="secondary" className="mb-3">Commitment</Badge>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Lock In Your Path</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Set your intent, time budget, and constraints so we can generate a
              personalized execution plan.
            </p>
          </div>

          {/* Selected Path Summary */}
          <Card className="animate-fade-up border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Your Chosen Path
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/path-options')}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg">{selectedPath.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedPath.tagline}</p>
              <div className="flex gap-2 mt-3">
                {selectedPath.time_horizon && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedPath.time_horizon}
                  </Badge>
                )}
                {selectedPath.difficulty && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedPath.difficulty}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Budget */}
          <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Weekly Time Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                How much time can you realistically dedicate each week?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeBudget(opt.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      timeBudget === opt.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intent Statement */}
          <Card className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Intent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="intent" className="text-sm text-muted-foreground mb-3 block">
                In 1–2 sentences, what do you want to achieve and why does it matter to you?
              </Label>
              <Textarea
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="e.g. I want to transition from nursing into healthcare management because I believe I can create better systems for patient care..."
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {intent.length}/500
              </p>
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card className="animate-fade-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                Constraints <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="constraints" className="text-sm text-muted-foreground mb-3 block">
                Any blockers, limitations, or non-negotiables we should factor in?
              </Label>
              <Textarea
                id="constraints"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g. I have two young children so evenings after 8pm are my only free time. I can't afford to leave my current job for at least 6 months..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </CardContent>
          </Card>

          {/* Info note */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your commitment shapes how we build your personal execution path. Be honest about
              your time and constraints — a realistic plan beats an ambitious one you can't follow.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-2 pb-8 animate-fade-up" style={{ animationDelay: '500ms' }}>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !timeBudget || !intent.trim()}
              className="rounded-full px-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Commit & Build My Path
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
