import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SuccessAnimation } from '@/components/assessment/SuccessAnimation';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const verifyPayment = async () => {
      if (!user) return;

      // Get session_id from URL if present
      const sessionId = searchParams.get('session_id');
      
      // Update user's paid status
      const { error } = await supabase
        .from('profiles')
        .update({ has_paid: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating payment status:', error);
      }

      // Refresh profile to get updated payment status
      await refreshProfile();
      
      setIsVerifying(false);
    };

    if (user) {
      verifyPayment();
    }
  }, [user, loading, navigate, searchParams, refreshProfile]);

  const handleContinue = () => {
    navigate('/assessment/full');
  };

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Verifying your payment..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <SuccessAnimation
        title="Payment Successful!"
        subtitle="Your full assessment is now unlocked"
        onComplete={() => setShowContinue(true)}
      />
      
      {showContinue && (
        <Button
          size="lg"
          className="mt-8 gradient-primary text-primary-foreground hover:opacity-90 animate-fade-up"
          onClick={handleContinue}
        >
          Continue to Full Assessment
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      )}
    </div>
  );
}
