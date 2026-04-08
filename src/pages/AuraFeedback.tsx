import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
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

const questions = [
  { id: 'overall', label: 'How would you rate your overall experience with Aura?' },
  { id: 'useful', label: 'How useful were the assessment insights?' },
  { id: 'recommend', label: 'How likely are you to recommend this to a friend?' },
];

export default function AuraFeedback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [freeText, setFreeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const prompt = "Before we wrap up, I'd love to hear your thoughts! Your feedback helps us improve and make the experience even better for future users. This will only take a moment.";
  const { displayed, done } = useTypingEffect(prompt, true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowForm(true), 300);
      return () => clearTimeout(t);
    }
  }, [done]);

  const handleRate = (questionId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [questionId]: rating }));
  };

  const allRated = questions.every(q => ratings[q.id]);

  const handleSubmit = async () => {
    if (!user || !allRated) return;
    setIsSubmitting(true);

    try {
      const { data: session } = await supabase
        .from('aura_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session) {
        await supabase
          .from('aura_sessions')
          .update({
            current_step: 7,
            identified_themes: {
              feedback: { ratings, freeText: freeText.trim() || null },
            },
          } as any)
          .eq('id', session.id);
      }

      toast.success('Thank you for your feedback!');
      navigate('/aura/future');
    } catch {
      toast.error('Failed to save feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="w-full max-w-xl">
        <AuraProgressBar currentStep={6} className="mb-10" />

        {/* Aura Avatar */}
        <div className="flex items-center gap-4 mb-7">
          <div className="w-12 h-12 chamfer-sm gradient-coral flex items-center justify-center shadow-accent flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none mb-1">Aura</p>
            <p className="text-xs text-muted-foreground">Step 6.5 — Your Feedback</p>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 mb-6 shadow-card">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* Feedback Form */}
        <div
          className={`transition-all duration-500 ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-elevated">
            <div className="space-y-6">
              {questions.map((q, qi) => (
                <div key={q.id} className={qi > 0 ? 'pt-6 border-t border-border/50' : ''}>
                  <p className="text-sm font-medium text-foreground mb-3">{q.label}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRate(q.id, star)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            (ratings[q.id] || 0) >= star
                              ? 'text-accent fill-accent'
                              : 'text-border hover:text-accent/40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-border/50">
                <p className="text-sm font-medium text-foreground mb-3">
                  Anything else you'd like to share? <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                <Textarea
                  placeholder="Tell us what you liked, what could be improved, or any suggestions..."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!allRated || isSubmitting}
              className="w-full h-12 text-base rounded-full btn-lift mt-6"
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
