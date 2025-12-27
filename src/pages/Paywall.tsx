import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { 
  Crown, 
  Check, 
  Brain, 
  Heart, 
  Target, 
  Sparkles, 
  Shield, 
  ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const benefits = [
  { icon: Brain, text: '12 comprehensive personality questions' },
  { icon: Heart, text: 'Deep emotional intelligence analysis' },
  { icon: Target, text: 'Personalized growth recommendations' },
  { icon: Sparkles, text: 'Detailed trait breakdowns' },
  { icon: Shield, text: 'Lifetime access to your results' },
];

export default function Paywall() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // If user has already paid, redirect to full assessment
    if (profile?.has_paid) {
      navigate('/assessment/full');
    }
  }, [profile, navigate]);

  const handlePayment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { priceId: 'personality_assessment' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/results/free')}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-8 px-4 md:px-8">
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-20 h-20 chamfer gradient-primary flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get the complete picture of your personality with our comprehensive assessment and detailed analysis.
          </p>
        </div>

        {/* Benefits */}
        <div className="chamfer bg-card p-6 md:p-8 mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What's Included
          </h2>
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-4">
                <div className="w-10 h-10 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">{benefit.text}</span>
                <Check className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="chamfer bg-secondary p-6 md:p-8 text-center animate-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="text-muted-foreground mb-2">One-time payment</p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-serif font-bold text-foreground">$29</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Lifetime access • No subscription
          </p>
          
          <Button
            size="lg"
            className="w-full gradient-primary text-primary-foreground hover:opacity-90 py-6 text-lg rounded-full"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Pay & Unlock Full Assessment
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            Secure payment powered by Stripe
          </div>
        </div>

        {/* Money back */}
        <p className="text-center text-sm text-muted-foreground mt-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
          Not satisfied? Contact us for a full refund within 7 days.
        </p>
      </main>
    </div>
  );
}
