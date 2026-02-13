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
  Star,
  TreePine,
  Heart,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssessmentResult {
  mbtiType?: string;
  discProfile?: { primary: string; secondary?: string; scores?: Record<string, number> };
  topStrengths?: string[];
  step1Hypothesis?: {
    mbtiTendency?: string;
    confidence?: number;
  };
  blobTree?: { currentBlob: number | null; desiredBlob: number | null };
  valueMap?: { topFive: string[] };
  wheelOfLife?: { scores: Record<string, number>; average: number };
}

// DISC color mapping
const discColors: Record<string, { bg: string; text: string; gradient: string }> = {
  D: { bg: 'bg-red-500', text: 'text-white', gradient: 'from-red-500 to-red-600' },
  I: { bg: 'bg-yellow-500', text: 'text-black', gradient: 'from-yellow-400 to-yellow-500' },
  S: { bg: 'bg-green-500', text: 'text-white', gradient: 'from-green-500 to-green-600' },
  C: { bg: 'bg-blue-500', text: 'text-white', gradient: 'from-blue-500 to-blue-600' },
};

// MBTI color mapping by temperament
const getMBTIColor = (type?: string): { bg: string; gradient: string } => {
  if (!type) return { bg: 'from-primary/20 via-primary/10 to-background', gradient: 'from-primary/20' };
  
  const lastTwo = type.slice(-2);
  if (['NT'].includes(type.slice(1, 3))) {
    // Analysts (INTJ, INTP, ENTJ, ENTP) - Purple
    return { bg: 'from-purple-500/20 via-purple-500/10 to-background', gradient: 'from-purple-500/30' };
  } else if (['NF'].includes(type.slice(1, 3))) {
    // Diplomats (INFJ, INFP, ENFJ, ENFP) - Green
    return { bg: 'from-emerald-500/20 via-emerald-500/10 to-background', gradient: 'from-emerald-500/30' };
  } else if (type.includes('S') && type.includes('J')) {
    // Sentinels (ISTJ, ISFJ, ESTJ, ESFJ) - Blue
    return { bg: 'from-blue-500/20 via-blue-500/10 to-background', gradient: 'from-blue-500/30' };
  } else if (type.includes('S') && type.includes('P')) {
    // Explorers (ISTP, ISFP, ESTP, ESFP) - Orange
    return { bg: 'from-orange-500/20 via-orange-500/10 to-background', gradient: 'from-orange-500/30' };
  }
  return { bg: 'from-primary/20 via-primary/10 to-background', gradient: 'from-primary/20' };
};

export default function Results() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<AssessmentResult>({});
  const [loadingResults, setLoadingResults] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      
      try {
        // Fetch Step1 assessment
        const { data: step1Data } = await supabase
          .from('step1_assessments')
          .select('ai_hypothesis')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .maybeSingle();

        // Fetch MBTI result
        const { data: mbtiData } = await supabase
          .from('mbti_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch DISC result
        const { data: discData } = await supabase
          .from('disc_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch Strengths result
        const { data: strengthsData } = await supabase
          .from('strengths_assessments')
          .select('result')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch Blob Tree result
        const { data: blobData } = await supabase
          .from('blob_tree_assessments')
          .select('current_blob, desired_blob')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch Value Map result
        const { data: valueData } = await supabase
          .from('value_map_assessments')
          .select('top_five')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fetch Wheel of Life result
        const { data: wolData } = await supabase
          .from('wheel_of_life_assessments')
          .select('scores')
          .eq('user_id', user.id)
          .eq('is_complete', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const mbtiResult = mbtiData?.result as { type?: string; axisResults?: Record<string, { percentage: number }> } | null;
        const discResult = discData?.result as { D?: number; I?: number; S?: number; C?: number; primaryStyle?: string; secondaryStyle?: string | null } | null;
        const strengthsResult = strengthsData?.result as { ranked_strengths?: { name: string; score: number }[] } | null;
        const step1Hypothesis = step1Data?.ai_hypothesis as { mbtiTendency?: string; confidence?: number } | null;

        let count = 0;
        if (step1Data) count++;
        if (mbtiData) count++;
        if (discData) count++;
        if (strengthsData) count++;
        if (blobData) count++;
        if (valueData) count++;
        if (wolData) count++;
        setCompletedCount(count);

        // Extract primary letter from "High C" -> "C"
        const primaryLetter = discResult?.primaryStyle?.replace('High ', '').split(' ')[0] || '';
        const secondaryLetter = discResult?.secondaryStyle?.replace('High ', '') || undefined;

        const topFiveValues = (valueData?.top_five as any[]) || [];

        // Process Wheel of Life scores
        const wolScores = wolData?.scores as Record<string, number> | null;
        let wolResult: AssessmentResult['wheelOfLife'] = undefined;
        if (wolScores) {
          const keys = Object.keys(wolScores);
          const avg = keys.length > 0 ? Math.round((keys.reduce((s, k) => s + (wolScores[k] || 0), 0) / keys.length) * 10) / 10 : 0;
          wolResult = { scores: wolScores, average: avg };
        }

        setResults({
          mbtiType: mbtiResult?.type,
          discProfile: discResult ? { 
            primary: primaryLetter, 
            secondary: secondaryLetter,
            scores: { D: discResult.D || 0, I: discResult.I || 0, S: discResult.S || 0, C: discResult.C || 0 }
          } : undefined,
          topStrengths: strengthsResult?.ranked_strengths?.slice(0, 5).map(s => s.name),
          step1Hypothesis: step1Hypothesis || undefined,
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

  if (loading || loadingResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your results..." />
      </div>
    );
  }

  const hasResults = completedCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-6xl py-8 px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-2">
            Your Quick Assessment Result
          </h1>
          <p className="text-muted-foreground">
            {hasResults 
              ? `${completedCount} assessment${completedCount > 1 ? 's' : ''} completed`
              : 'Complete assessments to see your results'
            }
          </p>
        </div>

        {!hasResults ? (
          <div className="chamfer bg-card border border-border p-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No results yet</h2>
            <p className="text-muted-foreground mb-6">Start your assessment journey to see insights here.</p>
            <Button onClick={() => navigate('/assessment/step1')} className="rounded-full">
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <>
            {/* Bento Grid Layout with staggered animations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              
            {/* Hero Card - Personality Type */}
              {(() => {
                const mbtiColor = getMBTIColor(results.mbtiType || results.step1Hypothesis?.mbtiTendency);
                return (
                  <button 
                    onClick={() => navigate('/assessment/mbti/results')}
                    className={`md:col-span-2 lg:col-span-2 chamfer bg-gradient-to-br ${mbtiColor.bg} p-8 md:p-10 relative overflow-hidden transition-all duration-700 hover:${mbtiColor.gradient} text-left ${
                      animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '0ms' }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <p className="text-primary text-sm font-medium mb-2">Your Personality Profile</p>
                    
                    <h2 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6">
                      {results.mbtiType || results.step1Hypothesis?.mbtiTendency || '????'}
                    </h2>
                    
                    <div className="chamfer-sm bg-background/80 backdrop-blur-sm p-4 max-w-md">
                      <p className="text-foreground text-sm">
                        {results.mbtiType 
                          ? "Your complete personality type based on 93 questions."
                          : results.step1Hypothesis?.mbtiTendency
                            ? "Preliminary type based on quick assessment. Complete full MBTI for accuracy."
                            : "Complete assessments to discover your type."
                        }
                      </p>
                    </div>
                  </button>
                );
              })()}

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
                  of 4 assessments completed
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

              {/* Confidence Score */}
              <div 
                className={`chamfer bg-card border border-border p-6 transition-all duration-700 ${
                  animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Profile Confidence
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-serif font-bold text-foreground">
                    {results.step1Hypothesis?.confidence 
                      ? `${Math.round(results.step1Hypothesis.confidence * 100)}%`
                      : '—'
                    }
                  </span>
                </div>
                <div className="h-2 bg-muted chamfer-sm overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(results.step1Hypothesis?.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

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
                  {completedCount >= 4 
                    ? 'All assessments complete. View your full strategy.'
                    : `Complete ${4 - completedCount} more assessment${4 - completedCount > 1 ? 's' : ''} for personalized growth plan.`
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
            {completedCount < 4 && (
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="rounded-full"
                  onClick={() => {
                    if (!results.mbtiType) navigate('/assessment/mbti');
                    else if (!results.discProfile) navigate('/assessment/disc');
                    else navigate('/assessment/strengths');
                  }}
                >
                  Continue to Next Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {completedCount >= 4 && (
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="rounded-full"
                  onClick={() => navigate('/strategy')}
                >
                  View Career Strategy
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
