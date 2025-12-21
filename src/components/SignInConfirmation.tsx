import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignInConfirmationProps {
  email: string;
  onComplete: () => void;
  duration?: number;
}

export function SignInConfirmation({ email, onComplete, duration = 2000 }: SignInConfirmationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          Signed in as
        </h2>
        <p className="text-lg text-primary font-medium mb-4">
          {email}
        </p>
        <p className="text-muted-foreground">
          Your progress has been restored.
        </p>
      </div>
    </div>
  );
}
