import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Rocket, MessageSquare, Calendar, Brain } from 'lucide-react';

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

export default function AuraFuture() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const prompt = "Looking ahead, we are also developing an advanced Gen AI complete coaching service for those who prefer an AI-driven, continuous coaching experience. This will be available as a premium, fee-based service in the future.";
  const { displayed, done } = useTypingEffect(prompt, true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(t);
    }
  }, [done]);

  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'Continuous AI Coaching',
      description: 'Ongoing personalised guidance that adapts as you grow and evolve.',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Real-Time Conversations',
      description: 'Chat with your AI coach anytime for advice, motivation, and accountability.',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: 'Progress Tracking',
      description: 'Automated goal tracking with weekly check-ins and milestone celebrations.',
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      title: 'Advanced Insights',
      description: 'Deeper analysis and predictive recommendations powered by cutting-edge AI.',
    },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Aura Avatar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aura</p>
            <p className="text-xs text-muted-foreground/60">Step 7 of 7 — What's Next</p>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-6 mb-6 shadow-[var(--shadow-soft)]">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* Features preview */}
        <div
          className={`transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-[var(--shadow-card)]">
            <h3 className="font-medium text-foreground mb-4">Coming Soon</h3>
            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/welcome')}
              className="w-full h-12 text-base rounded-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your journey with Aura is just beginning. We'll keep you updated on new features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
