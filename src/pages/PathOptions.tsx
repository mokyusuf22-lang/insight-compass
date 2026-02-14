import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight,
  Sparkles,
  Loader2,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  Lightbulb,
  Users,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface PathOption {
  title: string;
  tagline: string;
  description: string;
  time_horizon: string;
  difficulty: 'moderate' | 'challenging' | 'ambitious';
  key_actions: string[];
  fits_because: string;
  risk_note: string;
}

const difficultyConfig = {
  moderate: { label: 'Moderate', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  challenging: { label: 'Challenging', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  ambitious: { label: 'Ambitious', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
};

const COACHING_PROMPTS = [
  { icon: HelpCircle, question: 'What are your options right now?', placeholder: 'Think broadly — what paths could you realistically take from where you are?' },
  { icon: Lightbulb, question: 'What else could you do?', placeholder: 'If there were no limits, what else might be possible?' },
  { icon: History, question: 'What has worked for you in the past?', placeholder: 'Reflect on strategies or approaches that have helped you before…' },
  { icon: Users, question: 'Who could help you with this?', placeholder: 'Think about mentors, colleagues, friends, communities, organisations…' },
  { icon: Target, question: 'What steps could you take right now?', placeholder: 'What small, concrete actions could you start with this week?' },
];

export default function PathOptions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [paths, setPaths] = useState<PathOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingRec, setExistingRec] = useState<any>(null);

  // Coaching reflection state
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [showReflections, setShowReflections] = useState(true);
  const [reflectionPhase, setReflectionPhase] = useState<'reflect' | 'explore'>('reflect');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/path-options' } });
    }
  }, [user, authLoading, navigate]);

  // Check for existing recommendations
  useEffect(() => {
    const check = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('path_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setExistingRec(data);
          const recs = data.recommendations as any;
          if (Array.isArray(recs)) {
            setPaths(recs);
          } else if (recs?.paths) {
            setPaths(recs.paths);
          }
          if (data.selected_path_index !== null) {
            setSelectedIndex(data.selected_path_index);
          }
          // If paths already exist, skip to explore phase
          if (recs && (Array.isArray(recs) ? recs.length > 0 : recs?.paths?.length > 0)) {
            setReflectionPhase('explore');
            setShowReflections(false);
          }
        }
      } catch (err) {
        console.error('Error checking existing recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) check();
  }, [user, authLoading]);

  const handleReflectionChange = (index: number, value: string) => {
    setReflections(prev => ({ ...prev, [index]: value }));
  };

  const filledReflections = Object.values(reflections).filter(v => v.trim().length > 0).length;
  const canProceedToGenerate = filledReflections >= 2; // At least 2 reflections filled

  const generatePaths = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // Get reality report
      const { data: reportData } = await supabase
        .from('reality_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!reportData?.generated_summary) {
        toast.error('Please generate your Reality Report first.');
        navigate('/reality');
        return;
      }

      let realityReport: any;
      try {
        realityReport = JSON.parse(reportData.generated_summary);
      } catch {
        toast.error('Could not parse Reality Report. Please regenerate it.');
        navigate('/reality');
        return;
      }

      // Get onboarding data
      const { data: profile } = await supabase
        .from('profiles')
        .select('career_goals')
        .eq('user_id', user.id)
        .single();

      const onboarding = (profile?.career_goals as any)?.onboarding || {};

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'generate-path-options',
        {
          body: {
            reality_report: realityReport,
            onboarding: {
              name: onboarding.name || 'User',
              age: onboarding.age || 'Unknown',
              profession: onboarding.profession || 'Unknown',
              education: onboarding.education || 'Unknown',
              location: onboarding.location || 'Unknown',
              personalGoal: onboarding.personalGoal || 'Not specified',
              careerGoal: onboarding.careerGoal || 'Not specified',
            },
            // Include user reflections for better AI context
            user_reflections: Object.entries(reflections)
              .filter(([, v]) => v.trim())
              .map(([idx, v]) => ({
                question: COACHING_PROMPTS[parseInt(idx)]?.question,
                answer: v.trim(),
              })),
          },
        }
      );

      if (fnError) throw fnError;
      const generatedPaths = fnData.paths || [];
      setPaths(generatedPaths);
      setSelectedIndex(null);
      setReflectionPhase('explore');
      setShowReflections(false);

      // Save to path_recommendations
      const payload = {
        user_id: user.id,
        recommendations: generatedPaths as any,
        selected_path_index: null,
      };

      if (existingRec) {
        await supabase
          .from('path_recommendations')
          .update(payload)
          .eq('id', existingRec.id);
      } else {
        const { data: created } = await supabase
          .from('path_recommendations')
          .insert(payload)
          .select()
          .single();
        if (created) setExistingRec(created);
      }

      // Update profile flag
      await supabase
        .from('profiles')
        .update({ path_options_shown: true } as any)
        .eq('user_id', user.id);

      toast.success('Path options generated!');
    } catch (err: any) {
      console.error('Error generating path options:', err);
      toast.error(err.message || 'Failed to generate paths. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPath = async (index: number) => {
    setSelectedIndex(index);
    if (existingRec) {
      await supabase
        .from('path_recommendations')
        .update({ selected_path_index: index })
        .eq('id', existingRec.id);
    }
  };

  const confirmSelection = () => {
    if (selectedIndex === null) {
      toast.error('Please select a path first.');
      return;
    }
    navigate('/commit', { state: { selectedPath: paths[selectedIndex], pathIndex: selectedIndex } });
  };

  if (authLoading || isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <span className="text-5xl mb-3 block">💡</span>
            <Badge variant="secondary" className="mb-3">Options — Exploring Possibilities</Badge>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">
              {reflectionPhase === 'reflect' ? 'Explore Your Options' : 'Choose Your Direction'}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {reflectionPhase === 'reflect'
                ? "Before we generate AI-powered suggestions, take a moment to reflect on what you already know about your possibilities."
                : "Review the AI-generated paths alongside your own reflections. Select the one that resonates most."}
            </p>
          </div>

          {/* Coaching Reflection Section */}
          {reflectionPhase === 'reflect' && (
            <>
              <div className="space-y-4">
                {COACHING_PROMPTS.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <label className="font-medium text-sm">{prompt.question}</label>
                        </div>
                        <Textarea
                          value={reflections[i] || ''}
                          onChange={(e) => handleReflectionChange(i, e.target.value)}
                          placeholder={prompt.placeholder}
                          className="min-h-[80px] resize-none text-sm"
                          maxLength={500}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="text-center space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  {filledReflections < 2
                    ? `Answer at least 2 questions to continue (${filledReflections}/2)`
                    : `${filledReflections} reflections captured ✓`}
                </p>
                <Button
                  size="lg"
                  onClick={generatePaths}
                  disabled={!canProceedToGenerate || isGenerating}
                  className="rounded-full px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Your Paths…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI-Powered Options
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Your reflections will be combined with your Reality Report to generate personalised path options.
                </p>
              </div>
            </>
          )}

          {/* Explore Phase — show paths */}
          {reflectionPhase === 'explore' && paths.length > 0 && (
            <>
              {/* Toggle reflections */}
              <button
                onClick={() => setShowReflections(!showReflections)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                {showReflections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showReflections ? 'Hide' : 'Show'} your reflections
              </button>

              {showReflections && Object.values(reflections).some(v => v.trim()) && (
                <Card className="bg-muted/30 animate-fade-up">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your Reflections</p>
                    {Object.entries(reflections)
                      .filter(([, v]) => v.trim())
                      .map(([idx, v]) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium text-xs text-primary mb-1">
                            {COACHING_PROMPTS[parseInt(idx)]?.question}
                          </p>
                          <p className="text-muted-foreground">{v}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Path Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                {paths.map((path, i) => {
                  const diff = difficultyConfig[path.difficulty] || difficultyConfig.moderate;
                  const isSelected = selectedIndex === i;

                  return (
                    <Card
                      key={i}
                      className={`cursor-pointer transition-all duration-200 animate-fade-up ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-lg'
                          : 'hover:shadow-md hover:-translate-y-0.5'
                      }`}
                      style={{ animationDelay: `${i * 100}ms` }}
                      onClick={() => selectPath(i)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-serif leading-tight">
                              {path.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{path.tagline}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {path.time_horizon}
                          </Badge>
                          <Badge className={`text-xs ${diff.color}`}>
                            {diff.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {path.description}
                        </p>

                        {/* Key Actions */}
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                            Key Actions
                          </p>
                          <ul className="space-y-1.5">
                            {path.key_actions.map((action, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm">
                                <span className="text-primary font-bold mt-0.5">→</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Why it fits */}
                        <div className="p-3 rounded-lg bg-primary/5">
                          <p className="text-xs font-medium text-primary mb-1">Why this fits you</p>
                          <p className="text-sm">{path.fits_because}</p>
                        </div>

                        {/* Risk note */}
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <p>{path.risk_note}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReflectionPhase('reflect');
                    setShowReflections(true);
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Reflect & Regenerate
                </Button>
                <Button
                  onClick={confirmSelection}
                  disabled={selectedIndex === null}
                  className="rounded-full px-8"
                >
                  Continue to Will & Commitment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
