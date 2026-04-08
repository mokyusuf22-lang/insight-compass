import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div
      role="status"
      aria-label={text ?? 'Loading'}
      className={cn('flex flex-col items-center justify-center gap-4', className)}
    >
      <div
        className={cn(
          'rounded-full border-accent/20 border-t-accent animate-spin',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <p className="text-muted-foreground text-sm animate-pulse-soft" aria-hidden="true">
          {text}
        </p>
      )}
    </div>
  );
}
