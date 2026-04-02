import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  Target,
  Heart,
  BarChart3,
  Shield,
  Zap,
  TreePine,
  Compass,
} from 'lucide-react';
import { AuraProgressBar } from '@/components/aura/AuraProgressBar';

const TYPING_SPEED = 25;

function useTypingEffect(text: string, start: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!start) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, TYPING_SPEED);
    return () => clearInterval(interval);
  }, [text, start]);
  return { displayed, done };
}

interface IdentifiedTheme {
  area: string;
  confidence: number;
  explanation: string;
}

interface AssessmentItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  completionFlag: string;
  relevant: boolean;
}

export default function AuraAssessments() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [themes, setThemes] = useState<IdentifiedTheme[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [showAssessments, setShowAssessments] = useState(false);

  // Build dynamic intro based on themes
  const themeAreas = themes.map(t => t.area.toLowerCase()).join(', ');
  const introText = userName
    ? `Fantastic, ${userName}! Based on our earlier conversation, we've identified some key areas to explore further${themeAreas ? ` — particularly around ${themeAreas}` : ''}. To truly understand your motivations, values, and goals, we'll guide you through a selection of assessments designed specifically for your needs.`
    : `Based on our earlier conversation, we'll guide you through assessments designed specifically for your needs.`;

  const { displayed, done } = useTypingEffect(introText, true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowAssessments(true), 300);
      return () => clearTimeout(t);
    }
  }, [done]);

  // Load session & profile completion flags
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [sessionRes, profileRes] = await Promise.all([
        supabase
          .from('aura_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('disc_completed, value_map_complete, wheel_of_life_complete, blob_tree_complete, strengths_completed')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (sessionRes.data) {
        setSessionId(sessionRes.data.id);
        setUserName((sessionRes.data as any).name || '');
        const rawThemes = (sessionRes.data as any).identified_themes;
        if (Array.isArray(rawThemes)) setThemes(rawThemes);
      } else {
        navigate('/aura/welcome');
      }

      if (profileRes.data) {
        setCompletionStatus({
          disc: profileRes.data.disc_completed,
          values: profileRes.data.value_map_complete,
          wheel: profileRes.data.wheel_of_life_complete,
          blob: profileRes.data.blob_tree_complete,
          strengths: profileRes.data.strengths_completed,
        });
      }
    };
    if (!loading && user) load();
  }, [user, loading, navigate]);

  // Determine relevance based on themes
  const themeKeywords = themes.map(t => t.area.toLowerCase());
  const isRelevant = (keywords: string[]) =>
    themes.length === 0 || keywords.some(k => themeKeywords.some(tk => tk.includes(k) || k.includes(tk)));

  const assessments: AssessmentItem[] = [
    {
      id: 'disc',
      name: 'Quick Profile (DISC)',
      description: 'Assesses your behavioural type and communication style to understand how you interact with others.',
      icon: <BarChart3 className="w-5 h-5" />,
      route: '/assessment/disc',
      completionFlag: 'disc',
      relevant: true, // Always relevant
    },
    {
      id: 'values',
      name: 'Values Clarification',
      description: 'Identifies your core personal and professional values to ensure alignment with your choices.',
      icon: <Compass className="w-5 h-5" />,
      route: '/assessment/value-map',
      completionFlag: 'values',
      relevant: isRelevant(['career', 'purpose', 'motivation', 'values', 'fulfilment', 'balance', 'growth']),
    },
    {
      id: 'wheel',
      name: 'Wheel of Life',
      description: 'Visualises your satisfaction across key life areas to identify where to focus your energy.',
      icon: <Target className="w-5 h-5" />,
      route: '/assessment/wheel-of-life',
      completionFlag: 'wheel',
      relevant: isRelevant(['balance', 'life', 'satisfaction', 'well-being', 'health', 'relationships', 'fulfilment']),
    },
    {
      id: 'blob',
      name: 'Emotional Landscape (Blob Tree)',
      description: 'Explores your current emotional state and underlying feelings through a visual exercise.',
      icon: <TreePine className="w-5 h-5" />,
      route: '/assessment/blob-tree',
      completionFlag: 'blob',
      relevant: isRelevant(['emotion', 'stress', 'confidence', 'self-esteem', 'relationships', 'well-being']),
    },
    {
      id: 'strengths',
      name: 'Strengths & Weaknesses',
      description: 'Self-assessment to recognise your personal assets and areas for growth.',
      icon: <Zap className="w-5 h-5" />,
      route: '/assessment/strengths',
      completionFlag: 'strengths',
      relevant: isRelevant(['career', 'leadership', 'skills', 'growth', 'development', 'strengths']),
    },
  ];

  const relevantAssessments = assessments.filter(a => a.relevant);
  const allRelevantComplete = relevantAssessments.every(a => completionStatus[a.completionFlag]);

  const handleContinueToInsights = async () => {
    if (sessionId) {
      await supabase
        .from('aura_sessions')
        .update({ current_step: 6 } as any)
        .eq('id', sessionId);
    }
    navigate('/aura/insights');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Aura Avatar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aura</p>
            <p className="text-xs text-muted-foreground/60">Step 5 of 7 — Deep-Dive Assessments</p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-6 mb-6 shadow-[var(--shadow-soft)]">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* Assessments list */}
        <div
          className={`space-y-3 transition-all duration-500 ${showAssessments ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          {relevantAssessments.map((assessment, i) => {
            const isComplete = completionStatus[assessment.completionFlag];
            // Unlock sequentially: first is always unlocked, rest require previous complete
            const previousComplete = i === 0 || completionStatus[relevantAssessments[i - 1].completionFlag];
            const isLocked = !isComplete && !previousComplete;

            return (
              <div
                key={assessment.id}
                className={`bg-card border rounded-2xl p-5 shadow-[var(--shadow-card)] transition-all ${
                  isComplete ? 'border-accent/40 bg-accent/5' : isLocked ? 'border-border opacity-60' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isComplete ? 'bg-accent/20 text-accent' : isLocked ? 'bg-muted text-muted-foreground' : 'bg-accent/10 text-accent'
                  }`}>
                    {assessment.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{assessment.name}</h3>
                      {isComplete && <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />}
                      {isLocked && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{assessment.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {isComplete ? (
                      <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">Complete</span>
                    ) : isLocked ? (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Locked</span>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate(assessment.route)}
                      >
                        Start
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Continue button */}
          {allRelevantComplete && (
            <div className="pt-4 animate-fade-up">
              <div className="bg-card border border-accent/30 rounded-2xl p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <p className="font-medium text-foreground">All assessments complete!</p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Wonderful work! I now have everything I need to create your personalised insights summary.
                </p>
                <Button
                  onClick={handleContinueToInsights}
                  className="w-full h-12 text-base rounded-full"
                  size="lg"
                >
                  View My Insights
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Partial progress encouragement */}
          {!allRelevantComplete && showAssessments && (
            <div className="pt-2">
              <p className="text-center text-sm text-muted-foreground">
                Complete all assessments above to unlock your personalised insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
