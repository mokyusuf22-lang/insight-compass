import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="w-full max-w-xl">
        <AuraProgressBar currentStep={4} className="mb-10" />

        {/* Aura Avatar */}
        <div className="flex items-center gap-4 mb-7">
          <AuraOrb size="sm" interactive />
          <div>
            <p className="text-sm font-semibold text-foreground leading-none mb-1">Aura</p>
            <p className="text-xs text-muted-foreground">Step 4 of 7</p>
          </div>
        </div>

        {/* Chat bubble */}
        <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 mb-8 shadow-card">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* What to expect */}
        <div
          className={`transition-all duration-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="bg-card border border-border/70 rounded-2xl p-6 mb-5 shadow-elevated">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-accent" />
              </div>
              <p className="font-semibold text-foreground">What to expect</p>
            </div>
            <ul className="space-y-3">
              {[
                'A series of short, focused assessments tailored to your needs',
                'Each takes only a few minutes to complete',
                'Your results will create a comprehensive personal profile',
                'We\'ll use these insights to match you with the ideal coach',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full h-12 text-base rounded-full btn-lift"
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
