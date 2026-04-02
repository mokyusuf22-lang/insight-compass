import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ClipboardCheck } from 'lucide-react';
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

export default function AuraAssessmentIntro() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);

  const prompt = `Excellent${userName ? `, ${userName}` : ''}! To provide you with the most effective support, we'll now embark on a quick profiling exercise. This will help us understand your unique personality traits and behavioural preferences, which are key to tailoring your coaching journey. Shall we begin?`;

  const { displayed, done } = useTypingEffect(prompt, true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowButton(true), 300);
      return () => clearTimeout(t);
    }
  }, [done]);

  useEffect(() => {
    const load = async () => {
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
      } else {
        navigate('/aura/welcome');
      }
    };
    if (!loading && user) load();
  }, [user, loading, navigate]);

  const handleContinue = async () => {
    if (sessionId) {
      await supabase
        .from('aura_sessions')
        .update({ current_step: 5 } as any)
        .eq('id', sessionId);
    }
    navigate('/aura/assessments');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-16 pb-8">
      <div className="w-full max-w-xl">
        <AuraProgressBar currentStep={4} className="mb-8" />
        {/* Aura Avatar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aura</p>
            <p className="text-xs text-muted-foreground/60">Step 4 of 7</p>
          </div>
        </div>

        {/* Chat bubble */}
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-6 mb-8 shadow-[var(--shadow-soft)]">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* What to expect */}
        <div
          className={`transition-all duration-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardCheck className="w-5 h-5 text-accent" />
              <p className="font-medium text-foreground">What to expect</p>
            </div>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                A series of short, focused assessments tailored to your needs
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                Each takes only a few minutes to complete
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                Your results will create a comprehensive personal profile
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                We'll use these insights to match you with the ideal coach
              </li>
            </ul>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full h-12 text-base rounded-full"
            size="lg"
          >
            Let's begin
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
