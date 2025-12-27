import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Criterion {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const criteria: Criterion[] = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = criteria.filter(c => c.met).length;
    if (metCount <= 1) return { level: 'weak', label: 'Weak', color: 'bg-destructive' };
    if (metCount <= 2) return { level: 'fair', label: 'Fair', color: 'bg-orange-500' };
    if (metCount <= 3) return { level: 'good', label: 'Good', color: 'bg-yellow-500' };
    if (metCount <= 4) return { level: 'strong', label: 'Strong', color: 'bg-green-500' };
    return { level: 'excellent', label: 'Excellent', color: 'bg-primary' };
  }, [criteria]);

  const metCount = criteria.filter(c => c.met).length;

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn(
            "text-xs font-medium",
            strength.level === 'weak' && "text-destructive",
            strength.level === 'fair' && "text-orange-500",
            strength.level === 'good' && "text-yellow-500",
            strength.level === 'strong' && "text-green-500",
            strength.level === 'excellent' && "text-primary"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                segment <= metCount ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria list */}
      <ul className="space-y-1">
        {criteria.map((criterion, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              criterion.met ? "text-muted-foreground" : "text-muted-foreground/60"
            )}
          >
            {criterion.met ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground/40" />
            )}
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
