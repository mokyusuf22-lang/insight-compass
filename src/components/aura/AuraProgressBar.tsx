import { Check } from 'lucide-react';
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
  const currentLabel = STEPS[currentStep - 1]?.label ?? '';

  return (
    <div className={cn('w-full max-w-xl mx-auto', className)}>
      {/* Step pills + connector lines */}
      <div className="flex items-center mb-3">
        {STEPS.map((step, i) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all duration-400',
                  isCompleted && 'bg-accent text-white',
                  isCurrent && 'bg-accent text-white ring-2 ring-accent/25 ring-offset-2 ring-offset-background',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1 rounded-full transition-all duration-500',
                    step.number < currentStep ? 'bg-accent' : 'bg-muted',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Label row */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="text-xs font-medium text-accent">{currentLabel}</span>
      </div>
    </div>
  );
}
