import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div
        className={cn(
          "rounded-full border-primary/20 border-t-primary animate-spin",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-muted-foreground text-sm animate-pulse-soft">{text}</p>
      )}
    </div>
  );
}
