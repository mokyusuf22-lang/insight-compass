import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, Send, Loader2, Sparkles } from 'lucide-react';
import { AuraProgressBar } from '@/components/aura/AuraProgressBar';
import { AuraOrb } from '@/components/aura/AuraOrb';

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
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, TYPING_SPEED);
    return () => clearInterval(interval);
  }, [text, start]);

  return { displayed, done };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface IdentifiedTheme {
  area: string;
  confidence: number;
  explanation: string;
}

export default function AuraChallenge() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [challengeText, setChallengeText] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Phase 2: Show analysis results
  const [themes, setThemes] = useState<IdentifiedTheme[]>([]);
  const [auraSummary, setAuraSummary] = useState('');
  const [showResults, setShowResults] = useState(false);

  const prompt = userName
    ? `Great to meet you, ${userName}! Now, let's dive into what's on your mind. In your own words, please describe what you're seeking help with today. Are you looking for support with your career, life balance, relationships, finances, personal growth, or something else? Tell me about your current situation and what you hope to achieve.`
    : `Now, let's dive into what's on your mind. In your own words, please describe what you're seeking help with today. Are you looking for support with your career, life balance, relationships, finances, personal growth, or something else? Tell me about your current situation and what you hope to achieve.`;

  const { displayed: typedPrompt, done: promptDone } = useTypingEffect(prompt, true);
  const { displayed: typedSummary, done: summaryDone } = useTypingEffect(auraSummary, showResults);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (promptDone) {
      const timer = setTimeout(() => setShowInput(true), 300);
      return () => clearTimeout(timer);
    }
  }, [promptDone]);

  // Load existing session
  useEffect(() => {
    const loadSession = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('aura_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSessionId(data.id);
        setUserName((data as any).name || '');
        if ((data as any).challenge_text) {
          setChallengeText((data as any).challenge_text);
        }
      } else {
        // No session found — go back to step 1
        navigate('/aura/welcome');
      }
    };
    if (!loading && user) loadSession();
  }, [user, loading, navigate]);

  const wordCount = countWords(challengeText);
  const isValid = wordCount >= 30;

  const handleAnalyse = async () => {
    if (!user || !sessionId || !isValid) return;
    setIsAnalysing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-challenge', {
        body: { challenge_text: challengeText, user_name: userName },
      });

      if (error) throw error;

      const identifiedThemes: IdentifiedTheme[] = data.themes || [];
      const summary: string = data.summary || '';

      // Save to database
      await supabase
        .from('aura_sessions')
        .update({
          challenge_text: challengeText,
          identified_themes: identifiedThemes as any,
          aura_summary: summary,
          current_step: 3,
        } as any)
        .eq('id', sessionId);

      setThemes(identifiedThemes);
      setAuraSummary(summary);
      setShowResults(true);
    } catch (err: any) {
      console.error('Error analysing challenge:', err);
      if (err.message?.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else if (err.message?.includes('402')) {
        toast.error('AI service temporarily unavailable. Please try again later.');
      } else {
        toast.error('Failed to analyse your input. Please try again.');
      }
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleConfirmAndContinue = async () => {
    if (!sessionId) return;
    await supabase
      .from('aura_sessions')
      .update({ user_confirmed: true, current_step: 3 } as any)
      .eq('id', sessionId);

    navigate('/aura/assessment-intro');
  };

  const handleExpand = () => {
    setShowResults(false);
    setAuraSummary('');
    setThemes([]);
    toast.info('Please expand on your situation below.');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-16 pb-12 bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="w-full max-w-2xl">
        <AuraProgressBar currentStep={2} className="mb-10" />

        {/* Aura Avatar */}
        <div className="flex items-center gap-4 mb-7">
          <AuraOrb size="sm" interactive />
          <div>
            <p className="text-sm font-semibold text-foreground leading-none mb-1">Aura</p>
            <p className="text-xs text-muted-foreground">Understanding your needs</p>
          </div>
        </div>

        {/* Aura's prompt */}
        <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 mb-6 shadow-card">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {typedPrompt}
            {!promptDone && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* User input area */}
        {!showResults && (
          <div
            className={`transition-all duration-500 ${
              showInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-elevated">
              <Textarea
                placeholder="Tell Aura what's on your mind..."
                value={challengeText}
                onChange={(e) => setChallengeText(e.target.value)}
                className="min-h-[180px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 p-0 mb-4"
                disabled={isAnalysing}
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className={wordCount < 30 ? 'text-destructive' : 'text-[hsl(var(--success))]'}>
                    {wordCount}
                  </span>
                  {' '}words
                  {wordCount < 30 && (
                    <span className="text-muted-foreground/60 ml-1">(minimum 30)</span>
                  )}
                  {wordCount >= 30 && wordCount < 100 && (
                    <span className="text-muted-foreground/60 ml-1">— good start, feel free to share more</span>
                  )}
                  {wordCount >= 100 && (
                    <span className="text-muted-foreground/60 ml-1">— great detail!</span>
                  )}
                </div>

                <Button
                  onClick={handleAnalyse}
                  disabled={!isValid || isAnalysing}
                  className="rounded-full btn-lift"
                  size="lg"
                >
                  {isAnalysing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Aura is reading...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Share with Aura
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {showResults && auraSummary && (
          <div className="space-y-5 animate-fade-up">
            {/* Aura's understanding */}
            <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 shadow-card">
              <p className="text-xs font-medium text-accent mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Aura's understanding
              </p>
              <p className="text-foreground text-lg leading-relaxed font-serif">
                {typedSummary}
                {!summaryDone && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
              </p>
            </div>

            {/* Identified themes */}
            {themes.length > 0 && summaryDone && (
              <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-elevated animate-fade-up">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Focus areas identified</p>
                <div className="space-y-3">
                  {themes.map((theme, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border/40"
                    >
                      <div className="w-7 h-7 chamfer-sm bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-accent">{i + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{theme.area}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{theme.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation buttons */}
            {summaryDone && (
              <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-elevated animate-fade-up">
                <p className="text-foreground mb-5 font-serif text-base leading-relaxed">
                  Is this an accurate summary of what you're looking for, or would you like to expand on anything?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleConfirmAndContinue}
                    className="rounded-full flex-1 btn-lift"
                    size="lg"
                  >
                    Yes, that's right
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={handleExpand}
                    variant="outline"
                    className="rounded-full flex-1"
                    size="lg"
                  >
                    Let me expand
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
