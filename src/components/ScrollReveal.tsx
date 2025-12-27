import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'fade';
  delay?: number;
  duration?: number;
}

export function ScrollReveal({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  const baseStyles = 'transition-all ease-out';
  
  const hiddenStyles = {
    'fade-up': 'opacity-0 translate-y-8',
    'fade-left': 'opacity-0 -translate-x-8',
    'fade-right': 'opacity-0 translate-x-8',
    'scale': 'opacity-0 scale-95',
    'fade': 'opacity-0',
  };

  const visibleStyles = 'opacity-100 translate-y-0 translate-x-0 scale-100';

  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        isVisible ? visibleStyles : hiddenStyles[animation],
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
