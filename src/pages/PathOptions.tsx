import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function PathOptions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [paths, setPaths] = useState<PathOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingRec, setExistingRec] = useState<any>(null);

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
        }
      } catch (err) {
        console.error('Error checking existing recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) check();
  }, [user, authLoading]);

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
          },
        }
      );

      if (fnError) throw fnError;
      const generatedPaths = fnData.paths || [];
      setPaths(generatedPaths);
      setSelectedIndex(null);

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

  // Generation prompt
  if (paths.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8 text-center">
              <span className="text-5xl mb-4 block">🛤️</span>
              <h1 className="text-3xl md:text-4xl font-serif mb-4">Your Path Options</h1>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto">
                Based on your Reality Report, we'll generate 2–4 personalized career paths 
                — each with a clear direction, timeline, and key actions tailored to your 
                strengths and constraints.
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Distinct paths</strong> from conservative to ambitious</p>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Specific actions</strong> you can start executing</p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Realistic timelines</strong> based on your situation</p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={generatePaths}
                disabled={isGenerating}
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
                    Generate My Path Options
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Display paths
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <span className="text-5xl mb-3 block">🛤️</span>
            <Badge variant="secondary" className="mb-3">Path Options</Badge>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Choose Your Direction</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Select the path that resonates most. You can always adjust later.
            </p>
          </div>

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
              onClick={generatePaths}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Regenerate Options
            </Button>
            <Button
              onClick={confirmSelection}
              disabled={selectedIndex === null}
              className="rounded-full px-8"
            >
              Continue with Selected Path
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
