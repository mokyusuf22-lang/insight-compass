import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Rocket, MessageSquare, Calendar, Brain } from 'lucide-react';
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

export default function AuraFuture() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const prompt = "Looking ahead, we are developing an advanced Gen AI complete coaching service for those who prefer an AI-driven, continuous coaching experience. This will be available as a premium service in the future.";
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
      icon: <Brain className="w-4 h-4" />,
      title: 'Continuous AI Coaching',
      description: 'Ongoing personalised guidance that adapts as you grow and evolve.',
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      title: 'Real-Time Conversations',
      description: 'Chat with your AI coach anytime for advice, motivation, and accountability.',
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: 'Progress Tracking',
      description: 'Automated goal tracking with weekly check-ins and milestone celebrations.',
    },
    {
      icon: <Rocket className="w-4 h-4" />,
      title: 'Advanced Insights',
      description: 'Deeper analysis and predictive recommendations powered by cutting-edge AI.',
    },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="w-full max-w-xl">
        <AuraProgressBar currentStep={7} className="mb-10" />

        {/* Aura Avatar */}
        <div className="flex items-center gap-4 mb-7">
          <div className="w-12 h-12 chamfer-sm gradient-coral flex items-center justify-center shadow-accent flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none mb-1">Aura</p>
            <p className="text-xs text-muted-foreground">Step 7 of 7 — What's Next</p>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 mb-6 shadow-card">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* Features preview */}
        <div
          className={`transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="bg-card border border-border/70 rounded-2xl p-6 mb-5 shadow-elevated">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Coming Soon</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 chamfer-sm bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/welcome')}
              className="w-full h-12 text-base rounded-full btn-lift"
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
