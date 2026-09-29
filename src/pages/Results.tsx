import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import {
  Brain,
  Zap,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  TreePine,
  Heart,
  Target,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AssessmentResult {
  discProfile?: { primary: string; secondary?: string; scores?: Record<string, number> };
  topStrengths?: string[];
  blobTree?: { currentBlob: number | null; desiredBlob: number | null };
  valueMap?: { topFive: string[] };
  wheelOfLife?: { scores: Record<string, number>; average: number };
}

interface IdentifiedTheme { area: string; confidence: number }

// DISC color mapping
const discColors: Record<string, { bg: string; text: string; gradient: string }> = {
  D: { bg: 'bg-red-500', text: 'text-white', gradient: 'from-red-500 to-red-600' },
  I: { bg: 'bg-yellow-500', text: 'text-black', gradient: 'from-yellow-400 to-yellow-500' },
  S: { bg: 'bg-green-500', text: 'text-white', gradient: 'from-green-500 to-green-600' },
  C: { bg: 'bg-blue-500', text: 'text-white', gradient: 'from-blue-500 to-blue-600' },
};

const DISC_LABELS: Record<string, string> = {
  D: 'Dominance', I: 'Influence', S: 'Steadiness', C: 'Conscientiousness',
};

export default function Results() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<AssessmentResult>({});
  const [loadingResults, setLoadingResults] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [animationReady, setAnimationReady] = useState(false);
  const [auraSummary, setAuraSummary] = useState<string | null>(null);
  const [auraThemes, setAuraThemes] = useState<IdentifiedTheme[]>([]);
  const [profileName, setProfileName] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;

      try {
        const [discData, strengthsData, blobData, valueData, wolData, auraData] = await Promise.all([
          supabase.from('disc_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle().then(r => r.data),
          supabase.from('strengths_assessments').select('result').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle().then(r => r.data),
          supabase.from('blob_tree_assessments').select('current_blob, desired_blob').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle().then(r => r.data),
          supabase.from('value_map_assessments').select('top_five').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle().then(r => r.data),
          supabase.from('wheel_of_life_assessments').select('scores').eq('user_id', user.id).eq('is_complete', true).order('updated_at', { ascending: false }).limit(1).maybeSingle().then(r => r.data),
          supabase.from('aura_sessions').select('aura_summary, identified_themes, name, challenge_text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle().then(r => r.data),
        ]);

        const discResult = discData?.result as { D?: number; I?: number; S?: number; C?: number; primaryStyle?: string; secondaryStyle?: string | null } | null;
        const strengthsResult = strengthsData?.result as { ranked_strengths?: { name: string; score: number }[] } | null;

        // Aura data
        setAuraSummary((auraData as any)?.aura_summary || null);
        setAuraThemes(((auraData as any)?.identified_themes as IdentifiedTheme[]) || []);
        const name = (auraData as any)?.name || user.user_metadata?.display_name || '';
        setProfileName(name);
        setGoal((auraData as any)?.challenge_text || null);

        let count = 0;
        if (discData) count++;
        if (strengthsData) count++;
        if (blobData) count++;
        if (valueData) count++;
        if (wolData) count++;
        setCompletedCount(count);

        const primaryLetter = discResult?.primaryStyle?.replace('High ', '').split(' ')[0] || '';
        const secondaryLetter = discResult?.secondaryStyle?.replace('High ', '') || undefined;
        const topFiveValues = (valueData?.top_five as any[]) || [];

        const wolScores = wolData?.scores as Record<string, number> | null;
        let wolResult: AssessmentResult['wheelOfLife'] = undefined;
        if (wolScores) {
          const keys = Object.keys(wolScores);
          const avg = keys.length > 0 ? Math.round((keys.reduce((s, k) => s + (wolScores[k] || 0), 0) / keys.length) * 10) / 10 : 0;
          wolResult = { scores: wolScores, average: avg };
        }

        setResults({
          discProfile: discResult ? {
            primary: primaryLetter,
            secondary: secondaryLetter,
            scores: { D: discResult.D || 0, I: discResult.I || 0, S: discResult.S || 0, C: discResult.C || 0 }
          } : undefined,
          topStrengths: strengthsResult?.ranked_strengths?.slice(0, 5).map(s => s.name),
          blobTree: blobData ? { currentBlob: (blobData as any).current_blob, desiredBlob: (blobData as any).desired_blob } : undefined,
          valueMap: topFiveValues.length > 0 ? { topFive: topFiveValues.map((v: any) => typeof v === 'string' ? v : v.name || v.label || String(v)) } : undefined,
          wheelOfLife: wolResult,
        });
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoadingResults(false);
        setTimeout(() => setAnimationReady(true), 100);
      }
    };

    fetchResults();
  }, [user]);

  const buildCoachSummary = (): string => {
    const lines: string[] = [];
    lines.push('=== CLIENT PROFILE SUMMARY ===');
    if (profileName) lines.push(`Name: ${profileName}`);
    lines.push(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    lines.push('');

    if (goal) lines.push(`Goal: ${goal}`);
    if (auraSummary) {
      lines.push('COACHING FOCUS');
      lines.push(auraSummary);
      if (auraThemes.length > 0) {
        lines.push(`Focus Areas: ${auraThemes.map(t => t.area).join(', ')}`);
      }
      lines.push('');
    }

    lines.push('ASSESSMENT RESULTS');
    if (results.discProfile?.primary) {
      const letter = results.discProfile.primary.charAt(0);
      const label = DISC_LABELS[letter] || results.discProfile.primary;
      const score = results.discProfile.scores?.[letter];
      lines.push(`Behavioural Style: ${label}${score ? ` (${score}%)` : ''}`);
    }
    if (results.topStrengths?.length) lines.push(`Top Strengths: ${results.topStrengths.join(', ')}`);
    if (results.valueMap?.topFive.length) lines.push(`Core Values: ${results.valueMap.topFive.join(', ')}`);
    if (results.wheelOfLife) lines.push(`Life Balance Average: ${results.wheelOfLife.average}/10`);
    if (results.blobTree?.currentBlob !== null && results.blobTree?.currentBlob !== undefined) {
      lines.push(`Emotional State: Position ${results.blobTree.currentBlob} → ${results.blobTree.desiredBlob} (current → desired)`);
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCoachSummary());
      setCopied(true);
      toast.success('Profile summary copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  if (loading || loadingResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your results..." />
      </div>
    );
  }

  const hasResults = completedCount > 0;
  // Next deep-dive to suggest, in dashboard order.
  const nextDive = !results.discProfile ? '/assessment/disc'
    : !results.wheelOfLife ? '/assessment/wheel-of-life'
    : !results.valueMap ? '/assessment/value-map'
    : !results.blobTree ? '/assessment/blob-tree'
    : !results.topStrengths?.length ? '/assessment/strengths'
    : null;

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-6xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Your results
          </h1>
          <p className="text-muted-foreground">
            {hasResults
              ? `${completedCount} of 5 deep-dive assessments completed`
              : 'Take the deep-dive assessments from your dashboard to see results here'
            }
          </p>
        </div>

        {/* Aura Coaching Focus — shown when Aura flow has been completed */}
        {auraSummary && (
          <div className="chamfer bg-secondary/30 border border-border/60 p-6 mb-8 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">Coaching Focus</span>
            </div>
            {goal && <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">{goal}</h2>}
            <p className="text-foreground leading-relaxed mb-4">{auraSummary}</p>
            {auraThemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {auraThemes.map(t => (
                  <Badge key={t.area} variant="secondary" className="text-xs">{t.area}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasResults ? (
          <div className="chamfer bg-card border border-border p-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No results yet</h2>
            <p className="text-muted-foreground mb-6">Start with the working-style assessment. It takes about ten minutes.</p>
            <Button onClick={() => navigate('/assessment/disc')} className="rounded-full">
              Start DISC assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <>
            {/* Bento Grid Layout with staggered animations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">

              {/* Design Persona Card - DISC colored */}
              {(() => {
                const primaryType = results.discProfile?.primary?.charAt(0) || '';
                const discColor = discColors[primaryType] || { bg: 'bg-card', text: 'text-foreground', gradient: 'from-muted to-muted' };
                const hasDisc = !!results.discProfile;

                return (
                  <button
                    onClick={() => navigate('/assessment/disc/results')}
                    className={`chamfer ${hasDisc ? `bg-gradient-to-br ${discColor.gradient}` : 'bg-card border border-border'} p-6 flex flex-col transition-all duration-700 hover:opacity-90 text-left ${
                      animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '100ms' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs ${hasDisc ? 'bg-white/20 text-white' : 'bg-primary text-primary-foreground'} px-3 py-1 rounded-full`}>
                        Behavioral Style
                      </span>
                      <Sparkles className={`w-4 h-4 ${hasDisc ? 'text-white/70' : 'text-muted-foreground'}`} />
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className={`w-16 h-16 chamfer-sm ${hasDisc ? 'bg-white/20' : 'bg-foreground'} flex items-center justify-center mb-3`}>
                        <span className={`text-3xl font-bold ${hasDisc ? 'text-white' : 'text-background'}`}>
                          {primaryType || '?'}
                        </span>
                      </div>

                      <h3 className={`text-2xl font-serif font-semibold ${hasDisc ? 'text-white' : 'text-foreground'} mb-1`}>
                        {results.discProfile?.primary || 'DISC'}
                      </h3>

                      {results.discProfile?.scores && (
                        <div className="flex gap-2 mt-3">
                          {['D', 'I', 'S', 'C'].map((dim) => {
                            const score = results.discProfile?.scores?.[dim] || 0;
                            return (
                              <div key={dim} className="text-center">
                                <span className={`text-xs ${hasDisc ? 'text-white/70' : 'text-muted-foreground'}`}>{dim}</span>
                                <div className={`text-sm font-bold ${hasDisc ? 'text-white' : 'text-foreground'}`}>{score}%</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <p className={`text-xs text-center ${hasDisc ? 'text-white/80' : 'text-muted-foreground'} mt-2`}>
                      {results.discProfile
                        ? `${results.discProfile.secondary ? `Secondary: ${results.discProfile.secondary}` : 'Your dominant style'}`
                        : 'Complete DISC assessment'
                      }
                    </p>
                  </button>
                );
              })()}

              {/* Assessments Completed */}
              <div
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '150ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Total Assessments
                </p>
                <p className="text-5xl font-serif font-bold text-primary mb-4">
                  {completedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  of 5 deep-dives completed
                </p>
              </div>

              {/* Top Strengths */}
              <button
                onClick={() => navigate('/assessment/strengths/results')}
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 hover:border-primary/50 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                  Top Strengths
                </p>

                {results.topStrengths && results.topStrengths.length > 0 ? (
                  <div className="space-y-3">
                    {results.topStrengths.slice(0, 3).map((strength, index) => (
                      <div key={strength} className="flex items-center gap-3">
                        <div className={`w-8 h-8 chamfer-sm flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-foreground font-medium">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Zap className="w-5 h-5" />
                    <span className="text-sm">Complete Strengths assessment</span>
                  </div>
                )}
              </button>

              {/* DISC Scores Bar */}
              {(() => {
                const primaryType = results.discProfile?.primary?.charAt(0) || '';
                const discColor = discColors[primaryType] || { bg: 'bg-muted', text: 'text-foreground', gradient: 'from-muted to-muted' };
                const hasDisc = !!results.discProfile;

                return (
                  <button
                    onClick={() => navigate('/assessment/disc/results')}
                    className={`chamfer bg-gradient-to-r ${hasDisc ? discColor.gradient : 'from-amber-500 to-orange-500'} p-6 text-white transition-all duration-700 hover:opacity-90 text-left ${
                      animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '250ms' }}
                  >
                    <p className="text-xs uppercase tracking-wide opacity-80 mb-2">
                      DISC Profile
                    </p>
                    <h3 className="text-3xl font-serif font-bold mb-2">
                      {results.discProfile?.primary || 'DISC'}
                    </h3>
                    <p className="text-sm opacity-90">
                      {results.discProfile
                        ? `Score: ${results.discProfile.scores?.[primaryType] || 0}%`
                        : 'Discover your DISC profile'
                      }
                    </p>
                  </button>
                );
              })()}

              {/* Team Dynamics */}
              <div
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '350ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Team Dynamics
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {results.discProfile
                    ? `As a ${results.discProfile.primary}, you excel in collaborative environments.`
                    : 'Complete DISC to understand your team role.'
                  }
                </p>
              </div>

              {/* Growth Potential */}
              <div
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '400ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Growth Path
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {completedCount >= 5
                    ? 'All deep-dives complete. Your coach and Aura have the full picture.'
                    : `${5 - completedCount} more deep-dive${5 - completedCount > 1 ? 's' : ''} will sharpen your plan.`
                  }
                </p>
              </div>

              {/* Blob Tree Card */}
              <button
                onClick={() => navigate('/assessment/blob-tree/results')}
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 hover:border-primary/50 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '450ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <TreePine className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Blob Tree
                  </p>
                </div>
                {results.blobTree ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif font-bold text-foreground">#{results.blobTree.currentBlob}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-3xl font-serif font-bold text-primary">#{results.blobTree.desiredBlob}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Current → Desired position</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete Blob Tree assessment</p>
                )}
              </button>

              {/* Value Map Card */}
              <button
                onClick={() => navigate('/assessment/value-map/results')}
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 hover:border-primary/50 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '500ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Core Values
                  </p>
                </div>
                {results.valueMap ? (
                  <div className="space-y-1">
                    {results.valueMap.topFive.slice(0, 3).map((value, i) => (
                      <p key={value} className={`text-sm ${i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {i + 1}. {value}
                      </p>
                    ))}
                    {results.valueMap.topFive.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{results.valueMap.topFive.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete Value Map assessment</p>
                )}
              </button>

              {/* Wheel of Life Card */}
              <button
                onClick={() => navigate('/assessment/wheel-of-life/results')}
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 hover:border-primary/50 text-left ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '550ms' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Wheel of Life
                  </p>
                </div>
                {results.wheelOfLife ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif font-bold text-foreground">{results.wheelOfLife.average}</span>
                      <span className="text-sm text-muted-foreground">/10 avg</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {Object.entries(results.wheelOfLife.scores).slice(0, 8).map(([key, score]) => (
                        <div key={key} className="text-center">
                          <div className="h-8 bg-muted rounded-sm overflow-hidden flex items-end">
                            <div
                              className="w-full bg-primary/70 rounded-sm transition-all"
                              style={{ height: `${(score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Life balance across 8 areas</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete Wheel of Life assessment</p>
                )}
              </button>

            </div>

            {/* CTA to continue */}
            <div className="text-center mb-8">
              <Button size="lg" className="rounded-full" onClick={() => navigate(nextDive ?? '/welcome')}>
                {nextDive ? 'Continue to next assessment' : 'Back to dashboard'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Coach Profile Summary */}
            <div className="chamfer bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground">Coach Summary</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Shareable profile for your coach or client</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="rounded-full gap-2 flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {buildCoachSummary()}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
