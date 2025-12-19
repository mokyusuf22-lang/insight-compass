import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-serif font-semibold text-foreground mb-3">
          Payment Canceled
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Your payment was not completed. No charges were made. You can try again whenever you're ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/results/free')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>
          <Button
            className="gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => navigate('/paywall')}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
