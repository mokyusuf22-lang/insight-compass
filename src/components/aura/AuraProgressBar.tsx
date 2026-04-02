import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, label: 'Welcome' },
  { number: 2, label: 'Challenge' },
  { number: 3, label: 'Confirm' },
  { number: 4, label: 'Intro' },
  { number: 5, label: 'Assessments' },
  { number: 6, label: 'Insights' },
  { number: 7, label: 'Next Steps' },
];

interface AuraProgressBarProps {
  currentStep: number;
  className?: string;
}

export function AuraProgressBar({ currentStep, className }: AuraProgressBarProps) {
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className={cn('w-full max-w-xl mx-auto', className)}>
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Step label */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {STEPS[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
