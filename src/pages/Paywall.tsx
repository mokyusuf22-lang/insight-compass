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
  ArrowLeft,
  Zap,
  Users,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/subscriptionTiers';

const proFeatures = [
  { icon: Brain, text: 'Full AI coaching access' },
  { icon: Target, text: 'Up to 3 core assessments' },
  { icon: RefreshCw, text: 'Skill Path regeneration' },
  { icon: Sparkles, text: 'One active Skill Path' },
];

const premiumFeatures = [
  { icon: Users, text: 'AI + human coaching' },
  { icon: Heart, text: 'Full personality profile' },
  { icon: Zap, text: 'Unlimited assessments' },
  { icon: RefreshCw, text: 'Priority Skill Path regeneration' },
  { icon: MessageSquare, text: 'Advanced coaching insights' },
];

interface PlanCardProps {
  tier: SubscriptionTier;
  isCurrentPlan: boolean;
  onSelect: (tier: SubscriptionTier) => void;
  isLoading: boolean;
  loadingTier: SubscriptionTier | null;
}

function PlanCard({ tier, isCurrentPlan, onSelect, isLoading, loadingTier }: PlanCardProps) {
  const config = SUBSCRIPTION_TIERS[tier];
  const features = tier === 'pro' ? proFeatures : premiumFeatures;
  const isPremium = tier === 'premium';

  return (
    <div className={`chamfer p-6 md:p-8 ${isPremium ? 'bg-accent/5 border-2 border-accent/30' : 'bg-card border border-border'} ${isCurrentPlan ? 'ring-2 ring-success' : ''}`}>
      {isPremium && (
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-accent" />
          <span className="text-sm font-medium text-accent">Most Popular</span>
        </div>
      )}
      {isCurrentPlan && (
        <div className="inline-flex items-center gap-1 bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium mb-4">
          <Check className="w-4 h-4" />
          Your Plan
        </div>
      )}
      
      <h3 className="text-2xl font-serif font-semibold mb-2">{config.name}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-bold">{config.priceDisplay}</span>
        <span className="text-muted-foreground">/ month</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Billed monthly</p>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <div className="w-8 h-8 chamfer-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-foreground text-sm">{feature.text}</span>
          </li>
        ))}
      </ul>
      
      <Button
        className={`w-full ${isPremium ? 'gradient-coral text-white shadow-accent btn-lift' : ''}`}
        variant={isPremium ? 'default' : 'outline'}
        size="lg"
        onClick={() => onSelect(tier)}
        disabled={isLoading || isCurrentPlan}
      >
        {loadingTier === tier ? (
          <LoadingSpinner size="sm" />
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          `Get ${config.name}`
        )}
      </Button>
    </div>
  );
}

export default function Paywall() {
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const { user, subscription, loading, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Refresh subscription on mount
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (tier === 'free') return;

    setLoadingTier(tier);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
      setLoadingTier(null);
    }
  };

  if (loading || subscription.loading) {
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
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </header>

      {/* Content */}
      <main className="container max-w-5xl py-8 px-4 md:px-8">
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-20 h-20 chamfer gradient-coral flex items-center justify-center mx-auto mb-6 shadow-accent animate-float">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your career development goals. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <PlanCard
            tier="pro"
            isCurrentPlan={subscription.tier === 'pro'}
            onSelect={handleSelectPlan}
            isLoading={loadingTier !== null}
            loadingTier={loadingTier}
          />
          <PlanCard
            tier="premium"
            isCurrentPlan={subscription.tier === 'premium'}
            onSelect={handleSelectPlan}
            isLoading={loadingTier !== null}
            loadingTier={loadingTier}
          />
        </div>

        {/* Free tier info */}
        <div className="chamfer bg-secondary/50 p-6 text-center animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold mb-2">Free Plan</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Limited AI coaching • Limited assessments • View Skill Path overview (no regeneration)
          </p>
          {subscription.tier !== 'free' && (
            <p className="text-xs text-muted-foreground">
              You can manage your subscription in your <button onClick={() => navigate('/account')} className="underline hover:text-foreground">Account Settings</button>
            </p>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Shield className="w-4 h-4" />
          Secure payment powered by Stripe
        </div>
      </main>
    </div>
  );
}
