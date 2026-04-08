import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  TreePine,
  Compass,
  Loader2,
  User,
} from 'lucide-react';
import { AuraProgressBar } from '@/components/aura/AuraProgressBar';

const TYPING_SPEED = 20;

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

interface InsightSection {
  title: string;
  icon: React.ReactNode;
  content: string;
  available: boolean;
}

export default function AuraInsights() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightSection[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSections, setShowSections] = useState(false);

  const introText = `Thank you for completing your assessments${userName ? `, ${userName}` : ''}! I've now compiled your unique insights into a comprehensive summary. Here's what I've discovered about you:`;
  const { displayed, done: introDone } = useTypingEffect(introText, !isGenerating);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (introDone) {
      const t = setTimeout(() => setShowSections(true), 300);
      return () => clearTimeout(t);
    }
  }, [introDone]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [sessionRes, discRes, valuesRes, wheelRes, blobRes, strengthsRes] = await Promise.all([
        supabase.from('aura_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('disc_assessments').select('result, is_complete').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('value_map_assessments').select('ranked_values, is_complete').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('wheel_of_life_assessments').select('scores, is_complete').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('blob_tree_assessments').select('current_blob, desired_blob, is_complete').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('strengths_assessments').select('result, is_complete').eq('user_id', user.id).eq('is_complete', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (sessionRes.data) {
        setSessionId(sessionRes.data.id);
        setUserName((sessionRes.data as any).name || '');
      }

      const sections: InsightSection[] = [];

      if (discRes.data?.result) {
        const r = discRes.data.result as any;
        sections.push({
          title: 'Behavioural Profile (DISC)',
          icon: <BarChart3 className="w-4 h-4" />,
          content: r.summary || `Your primary style is ${r.primaryStyle || 'being determined'}. This indicates your natural approach to challenges and communication.`,
          available: true,
        });
      }

      if (valuesRes.data?.ranked_values) {
        const vals = valuesRes.data.ranked_values as any[];
        const topVals = Array.isArray(vals) ? vals.slice(0, 3).join(', ') : 'your core values';
        sections.push({
          title: 'Core Values',
          icon: <Compass className="w-4 h-4" />,
          content: `Your top values include ${topVals}. These are the principles that drive your decisions and define what matters most to you.`,
          available: true,
        });
      }

      if (wheelRes.data?.scores) {
        const scores = wheelRes.data.scores as Record<string, number>;
        const entries = Object.entries(scores);
        const highest = entries.sort((a, b) => b[1] - a[1])[0];
        const lowest = entries.sort((a, b) => a[1] - b[1])[0];
        sections.push({
          title: 'Life Balance Snapshot',
          icon: <Target className="w-4 h-4" />,
          content: `Your strongest area is ${highest?.[0] || 'being assessed'} and your primary growth opportunity is in ${lowest?.[0] || 'being assessed'}. This gives us a clear picture of where to focus your energy.`,
          available: true,
        });
      }

      if (blobRes.data) {
        sections.push({
          title: 'Emotional Landscape',
          icon: <TreePine className="w-4 h-4" />,
          content: `Your current emotional position and desired state have been captured. This helps us understand where you are emotionally and where you'd like to be.`,
          available: true,
        });
      }

      if (strengthsRes.data?.result) {
        const r = strengthsRes.data.result as any;
        const topStrengths = r.ranked_strengths?.slice(0, 3).map((s: any) => s.name).join(', ') || 'your key strengths';
        sections.push({
          title: 'Strengths & Growth Areas',
          icon: <Zap className="w-4 h-4" />,
          content: `Your primary strengths are ${topStrengths}. These are the areas where you naturally excel and create value.`,
          available: true,
        });
      }

      setInsights(sections);

      try {
        const { data: recData, error } = await supabase.functions.invoke('generate-coaching-recommendation', {
          body: {
            user_name: (sessionRes.data as any)?.name,
            themes: (sessionRes.data as any)?.identified_themes,
            disc: discRes.data?.result,
            values: valuesRes.data?.ranked_values,
            wheel: wheelRes.data?.scores,
            blob: blobRes.data ? { current: blobRes.data.current_blob, desired: blobRes.data.desired_blob } : null,
            strengths: strengthsRes.data?.result,
          },
        });

        if (recData?.recommendation) {
          setRecommendation(recData.recommendation);
        } else {
          setRecommendation('Based on your profile, I recommend connecting with a coach who specialises in your identified focus areas. They can provide the personalised guidance and accountability you need to achieve your goals.');
        }
      } catch {
        setRecommendation('Based on your profile, I recommend connecting with a coach who specialises in your identified focus areas. They can provide the personalised guidance and accountability you need to achieve your goals.');
      }

      setIsGenerating(false);
    };
    if (!loading && user) load();
  }, [user, loading, navigate]);

  const handleContinueToFeedback = async () => {
    if (sessionId) {
      await supabase
        .from('aura_sessions')
        .update({ current_step: 7 } as any)
        .eq('id', sessionId);
    }
    navigate('/aura/feedback');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-16 pb-12 bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="w-full max-w-2xl">
        <AuraProgressBar currentStep={6} className="mb-10" />

        {/* Aura Avatar */}
        <div className="flex items-center gap-4 mb-7">
          <AuraOrb size="sm" interactive />
          <div>
            <p className="text-sm font-semibold text-foreground leading-none mb-1">Aura</p>
            <p className="text-xs text-muted-foreground">Step 6 of 7 — Your Insights</p>
          </div>
        </div>

        {/* Loading state */}
        {isGenerating && (
          <div className="bg-card border border-border/70 rounded-2xl p-10 text-center shadow-elevated">
            <div className="w-14 h-14 chamfer-sm gradient-coral flex items-center justify-center shadow-accent mx-auto mb-5">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <p className="text-foreground font-serif text-lg mb-2">Aura is compiling your insights...</p>
            <p className="text-sm text-muted-foreground">Analysing your assessment results</p>
          </div>
        )}

        {/* Content */}
        {!isGenerating && (
          <>
            <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 mb-6 shadow-card">
              <p className="text-foreground text-lg leading-relaxed font-serif">
                {displayed}
                {!introDone && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
              </p>
            </div>

            {/* Insight sections */}
            <div
              className={`space-y-4 transition-all duration-500 ${showSections ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
            >
              {insights.map((section, i) => (
                <div
                  key={i}
                  className="bg-card border border-border/70 rounded-2xl p-5 shadow-card animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 chamfer-sm bg-accent/10 flex items-center justify-center text-accent">
                      {section.icon}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-11">{section.content}</p>
                </div>
              ))}

              {/* Recommendation */}
              {recommendation && insights.length > 0 && (
                <div className="border border-accent/25 rounded-2xl p-6 shadow-elevated animate-fade-up" style={{ background: 'linear-gradient(135deg, hsl(22 92% 62% / 0.06) 0%, hsl(22 92% 62% / 0.02) 100%)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 chamfer-sm gradient-coral flex items-center justify-center shadow-accent">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">Aura's Recommendation</h3>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-5">{recommendation}</p>
                  <Button
                    onClick={handleContinueToFeedback}
                    className="w-full h-12 text-base rounded-full btn-lift"
                    size="lg"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {/* No insights fallback */}
              {insights.length === 0 && (
                <div className="bg-card border border-border/70 rounded-2xl p-6 text-center shadow-card">
                  <p className="text-muted-foreground mb-4 text-sm">No completed assessments found. Please complete at least one assessment first.</p>
                  <Button onClick={() => navigate('/aura/assessments')} variant="outline" className="rounded-full">
                    Back to Assessments
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
