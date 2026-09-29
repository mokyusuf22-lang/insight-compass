import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-[13px] font-bold uppercase tracking-[0.08em] text-bm-green', className)}>
      {children}
    </div>
  );
}

export function StepHeader({ eyebrow, title, sub }: { eyebrow: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2.5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="m-0 font-display text-4xl font-normal leading-[1.02] md:text-5xl">{title}</h1>
      {sub && <p className="m-0 text-[17px] leading-normal text-bm-muted">{sub}</p>}
    </header>
  );
}

export function StepFooter({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <footer className="mt-auto flex items-center justify-between gap-4 border-t border-bm-line pt-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="h-[50px] rounded-full border border-bm-edge bg-transparent px-[22px] text-[15px] font-semibold text-bm-ink"
        >
          Back
        </button>
      ) : <span />}
      {children}
    </footer>
  );
}

export function PrimaryButton({ className, disabled, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'h-[50px] shrink-0 rounded-full border-0 px-7 text-base font-semibold transition-colors',
        disabled ? 'cursor-not-allowed bg-bm-disabled text-bm-disabled-ink' : 'bg-bm-ink text-bm-paper hover:bg-black',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Pill toggle used for single- and multi-select answers. */
export function Chip({ on, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        'h-[46px] rounded-full border px-5 text-[15px] font-medium transition-colors',
        on ? 'border-bm-ink bg-bm-ink text-bm-paper' : 'border-bm-line bg-bm-paper text-bm-ink hover:border-bm-stone',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Larger selectable card (goals, working styles, support options). */
export function SelectCard({ on, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        'flex flex-col items-start rounded-2xl border text-left transition-colors',
        on ? 'border-bm-green bg-bm-green text-bm-paper' : 'border-bm-line bg-bm-paper text-bm-ink hover:border-bm-stone',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('font-display text-[32px] leading-none', className)}>
      Be<span className="text-bm-green">:</span>More
    </div>
  );
}
