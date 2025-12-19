import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  title: string;
  subtitle?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ title, subtitle, onComplete }: SuccessAnimationProps) {
  const [showCheck, setShowCheck] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const checkTimer = setTimeout(() => setShowCheck(true), 300);
    const confettiTimer = setTimeout(() => setShowConfetti(true), 600);
    const completeTimer = setTimeout(() => onComplete?.(), 3000);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(confettiTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] relative">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                backgroundColor: i % 3 === 0 
                  ? 'hsl(230, 65%, 55%)' 
                  : i % 3 === 1 
                    ? 'hsl(260, 45%, 65%)'
                    : 'hsl(175, 55%, 45%)',
                animation: `confetti 2.5s ease-out ${Math.random() * 0.5}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Success circle */}
      <div
        className={cn(
          "w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow transition-all duration-500",
          showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}
      >
        <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
      </div>

      {/* Text */}
      <div className={cn(
        "mt-8 text-center transition-all duration-500 delay-300",
        showCheck ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}>
        <h2 className="text-3xl font-serif font-semibold text-foreground flex items-center justify-center gap-2">
          {title}
          <Sparkles className="w-6 h-6 text-secondary" />
        </h2>
        {subtitle && (
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
