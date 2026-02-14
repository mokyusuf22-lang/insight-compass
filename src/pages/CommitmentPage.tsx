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
import { Slider } from '@/components/ui/slider';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  Loader2,
  Sparkles,
  Flame,
  CalendarDays,
  MapPin,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const TIME_OPTIONS = [
  { value: '2-3 hours/week', label: '2–3 hrs/week', description: 'Light commitment, steady progress' },
  { value: '4-6 hours/week', label: '4–6 hrs/week', description: 'Moderate pace, visible results' },
  { value: '7-10 hours/week', label: '7–10 hrs/week', description: 'Serious commitment, fast progress' },
  { value: '10+ hours/week', label: '10+ hrs/week', description: 'All-in, maximum momentum' },
];

const WILL_QUESTIONS = [
  {
    id: 'what',
    icon: Target,
    question: 'What will you do about this?',
    placeholder: 'Be specific — what concrete action will you take first?',
    required: true,
  },
  {
    id: 'how',
    icon: Zap,
    question: 'How will you do it?',
    placeholder: 'What approach or method will you use?',
    required: true,
  },
  {
    id: 'when',
    icon: CalendarDays,
    question: 'When will you start?',
    placeholder: 'Set a specific date or timeframe — e.g. "This Monday" or "Within the next 48 hours"',
    required: true,
  },
  {
    id: 'who',
    icon: Users,
    question: 'Who will support you?',
    placeholder: 'Who will you tell about this commitment? Who can hold you accountable?',
    required: false,
  },
  {
    id: 'more',
    icon: Flame,
    question: 'Could you do more? What else could you commit to?',
    placeholder: 'Push yourself — is there anything else you could take on to accelerate progress?',
    required: false,
  },
];

export default function CommitmentPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [timeBudget, setTimeBudget] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState([7]);
  const [willAnswers, setWillAnswers] = useState<Record<string, string>>({});
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
        setConstraints(commitment.constraints || '');
        // Parse intent back into will answers if possible
        if (commitment.intent) {
          try {
            const parsed = JSON.parse(commitment.intent);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
              setWillAnswers(parsed);
            } else {
              setWillAnswers({ what: commitment.intent });
            }
          } catch {
            setWillAnswers({ what: commitment.intent });
          }
        }
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

  const handleWillChange = (id: string, value: string) => {
    setWillAnswers(prev => ({ ...prev, [id]: value }));
  };

  const requiredFilled = WILL_QUESTIONS
    .filter(q => q.required)
    .every(q => (willAnswers[q.id] || '').trim().length > 0);

  const canSubmit = !!timeBudget && requiredFilled;

  const handleSubmit = async () => {
    if (!user || !selectedPath) return;
    if (!canSubmit) {
      toast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build a structured intent from all will answers
      const intentData = JSON.stringify(willAnswers);

      const payload = {
        user_id: user.id,
        chosen_path: selectedPath as any,
        time_budget: timeBudget,
        intent: intentData,
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

      toast.success("Commitment locked in! Let's build your path.");
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
            <span className="text-5xl mb-3 block">🔥</span>
            <Badge variant="secondary" className="mb-3">Will — Your Commitment</Badge>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Lock In Your Actions</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              This is where intention becomes action. Be specific about what you <em>will</em> do, 
              not just what you <em>could</em> do.
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

          {/* Will Questions — The Core */}
          {WILL_QUESTIONS.map((q, i) => {
            const Icon = q.icon;
            return (
              <Card key={q.id} className="animate-fade-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <label className="font-medium text-sm">
                        {q.question}
                        {q.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                    </div>
                  </div>
                  <Textarea
                    value={willAnswers[q.id] || ''}
                    onChange={(e) => handleWillChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="min-h-[80px] resize-none text-sm"
                    maxLength={500}
                  />
                </CardContent>
              </Card>
            );
          })}

          {/* Commitment Level */}
          <Card className="animate-fade-up" style={{ animationDelay: '500ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                How committed are you?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Exploring</span>
                <span className="text-2xl font-bold text-foreground">{commitmentLevel[0]}/10</span>
                <span>All in</span>
              </div>
              <Slider
                value={commitmentLevel}
                onValueChange={setCommitmentLevel}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
              {commitmentLevel[0] < 7 && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  💡 What would it take to raise your commitment by 1 or 2 points? Sometimes naming the blocker helps.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Time Budget */}
          <Card className="animate-fade-up" style={{ animationDelay: '600ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Weekly Time Budget <span className="text-destructive text-sm">*</span>
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

          {/* Constraints */}
          <Card className="animate-fade-up" style={{ animationDelay: '700ms' }}>
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

          {/* Wisdom note */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 animate-fade-up" style={{ animationDelay: '800ms' }}>
            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              A realistic commitment beats an ambitious one you can't follow. Be honest about
              your time and energy — your execution plan will be built around what you commit to here.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-2 pb-8 animate-fade-up" style={{ animationDelay: '900ms' }}>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
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
