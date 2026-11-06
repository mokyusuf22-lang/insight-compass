import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoachProfile, PRIMARY_COACH } from '@/lib/coachProfile';

/** Who the coach is and what they do. `compact` shows just the header and bio. */
export function CoachCard({
  coach = PRIMARY_COACH,
  compact = false,
  className,
}: {
  coach?: CoachProfile;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left', className)}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
          aria-hidden
        >
          {coach.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold leading-tight">{coach.name}</p>
          <p className="text-sm text-muted-foreground">{coach.title}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{coach.bio}</p>
      {!compact && (
        <>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Can help you with</p>
            <ul className="flex flex-col gap-1.5">
              {coach.helpsWith.map((h) => (
                <li key={h} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{coach.approach}</p>
          <p className="text-xs text-muted-foreground">{coach.availability}</p>
        </>
      )}
    </div>
  );
}
