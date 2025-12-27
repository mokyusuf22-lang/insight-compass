import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SuccessAnimation } from '@/components/assessment/SuccessAnimation';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const { user, loading, refreshSubscription, subscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const verifyPayment = async () => {
      if (!user) return;

      // Refresh subscription status from Stripe
      await refreshSubscription();
      
      setIsVerifying(false);
    };

    if (user) {
      verifyPayment();
    }
  }, [user, loading, navigate, refreshSubscription]);

  const handleContinue = () => {
    navigate('/path');
  };

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Verifying your subscription..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SuccessAnimation
        title="Subscription Activated!"
        subtitle={`Welcome to the ${subscription.tierName} plan`}
        onComplete={() => setShowContinue(true)}
      />
      
      {showContinue && (
        <Button
          size="lg"
          className="mt-8 gradient-primary text-primary-foreground hover:opacity-90 animate-fade-up"
          onClick={handleContinue}
        >
          Continue to Skill Path
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      )}
    </div>
  );
}
