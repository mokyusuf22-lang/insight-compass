import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { blobInterpretations } from '@/data/blobTreeData';
import { coreValues, getValueInsights } from '@/data/valueMapData';
import { UserHeader } from '@/components/UserHeader';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Sparkles,
  Shield,
  AlertTriangle,
  Target,
  Lightbulb,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface RealityReportData {
  headline: string;
  summary: string;
  strengths: string[];
  constraints: string[];
  risks: string[];
  growth_direction: string;
  key_insight: string;
}

export default function RealityReport() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<RealityReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/reality' } });
    }
  }, [user, authLoading, navigate]);

  // Check for existing report
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('reality_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setExistingReport(data);
          // Reconstruct report from stored data
          if (data.generated_summary) {
            try {
              setReport(JSON.parse(data.generated_summary));
            } catch {
              // If it's not JSON, it's the old format
            }
          }
        }
      } catch (err) {
        console.error('Error checking existing report:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) checkExisting();
  }, [user, authLoading]);

  const generateReport = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // Fetch blob tree data
      const { data: blobData } = await supabase
        .from('blob_tree_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!blobData) {
        toast.error('Please complete the Blob Tree assessment first.');
        navigate('/assessment/blob-tree');
        return;
      }

      // Fetch value map data
      const { data: valueData } = await supabase
        .from('value_map_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!valueData) {
        toast.error('Please complete the Value Map assessment first.');
        navigate('/assessment/value-map');
        return;
      }

      // Get onboarding data from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('career_goals')
        .eq('user_id', user.id)
        .single();

      const onboarding = (profile?.career_goals as any)?.onboarding || {};

      // Build blob tree context
      const currentInterp = blobInterpretations[(blobData as any).current_blob] || { title: 'Unknown', traits: [] };
      const desiredInterp = blobInterpretations[(blobData as any).desired_blob] || { title: 'Unknown', traits: [] };

      // Build value map context
      const rankedIds = (valueData as any).ranked_values || [];
      const valueNames = rankedIds.map((id: string) => coreValues.find(v => v.id === id)?.name || id);
      const insights = getValueInsights(rankedIds);

      const requestBody = {
        blob_tree: {
          current_blob: (blobData as any).current_blob,
          desired_blob: (blobData as any).desired_blob,
          current_title: currentInterp.title,
          current_traits: currentInterp.traits,
          desired_title: desiredInterp.title,
          desired_traits: desiredInterp.traits,
        },
        value_map: {
          ranked_values: rankedIds,
          value_names: valueNames,
          archetype: insights.archetype,
        },
        onboarding: {
          name: onboarding.name || 'User',
          age: onboarding.age || 'Unknown',
          profession: onboarding.profession || 'Unknown',
          education: onboarding.education || 'Unknown',
          location: onboarding.location || 'Unknown',
          maritalStatus: onboarding.maritalStatus || 'Unknown',
          hasChildren: onboarding.hasChildren || 'Unknown',
          hobbies: onboarding.hobbies || 'Unknown',
          personalGoal: onboarding.personalGoal || 'Not specified',
          careerGoal: onboarding.careerGoal || 'Not specified',
        },
      };

      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'generate-reality-report',
        { body: requestBody }
      );

      if (fnError) throw fnError;

      const reportData = fnData as RealityReportData;
      setReport(reportData);

      // Save to reality_reports table
      const reportPayload = {
        user_id: user.id,
        blob_tree_summary: {
          current_blob: (blobData as any).current_blob,
          desired_blob: (blobData as any).desired_blob,
          current_title: currentInterp.title,
          desired_title: desiredInterp.title,
        },
        value_map_summary: {
          ranked_values: rankedIds,
          value_names: valueNames,
          archetype: insights.archetype,
        },
        strengths: reportData.strengths,
        key_constraints: reportData.constraints,
        risks: reportData.risks,
        generated_summary: JSON.stringify(reportData),
      };

      if (existingReport) {
        await supabase
          .from('reality_reports')
          .update(reportPayload as any)
          .eq('id', existingReport.id);
      } else {
        const { data: created } = await supabase
          .from('reality_reports')
          .insert(reportPayload as any)
          .select()
          .single();
        if (created) setExistingReport(created);
      }

      // Update profile flag
      await supabase
        .from('profiles')
        .update({ reality_report_generated: true } as any)
        .eq('user_id', user.id);

      toast.success('Reality Report generated!');
    } catch (err: any) {
      console.error('Error generating reality report:', err);
      toast.error(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;

  // If no report yet, show the generation prompt
  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <UserHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8 text-center">
              <span className="text-5xl mb-4 block">📊</span>
              <h1 className="text-3xl md:text-4xl font-serif mb-4">Your Reality Report</h1>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto">
                We'll synthesize your Blob Tree emotional snapshot and Value Map into a clear,
                honest assessment of where you are right now — your strengths, constraints, and
                the gap between your current and desired state.
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Identifies your <strong>genuine strengths</strong> to leverage</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Names <strong>realistic constraints</strong> to work around</p>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Articulates your <strong>growth direction</strong></p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={generateReport}
                disabled={isGenerating}
                className="rounded-full px-8"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Your Report…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Reality Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Display the generated report
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Headline */}
          <div className="text-center animate-fade-up">
            <span className="text-5xl mb-3 block">📊</span>
            <Badge variant="secondary" className="mb-3">Reality Report</Badge>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">{report.headline}</h1>
          </div>

          {/* Summary */}
          <Card className="animate-fade-up">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {report.summary}
              </p>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="animate-fade-up border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                  <span className="text-primary font-bold text-sm mt-0.5">✓</span>
                  <p className="text-sm">{s}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card className="animate-fade-up border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                Constraints to Navigate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.constraints.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                  <span className="text-accent font-bold text-sm mt-0.5">⚠</span>
                  <p className="text-sm">{c}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Risks */}
          <Card className="animate-fade-up border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Target className="w-5 h-5 text-destructive" />
                Blind Spots & Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                  <span className="text-destructive font-bold text-sm mt-0.5">!</span>
                  <p className="text-sm">{r}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Growth Direction */}
          <Card className="animate-fade-up bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif text-lg mb-2">Growth Direction</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {report.growth_direction}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insight */}
          <Card className="animate-fade-up gradient-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif text-lg mb-2">Key Insight</h3>
                  <p className="text-sm leading-relaxed opacity-90">
                    {report.key_insight}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              variant="outline"
              onClick={generateReport}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Regenerate Report
            </Button>
            <Button onClick={() => navigate('/path-options')} className="rounded-full px-8">
              Continue to Path Options
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
