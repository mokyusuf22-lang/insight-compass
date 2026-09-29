import { KeyboardEvent } from 'react';
import { Pencil, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuraFlowState, GoalRef } from '@/lib/auraFlow';
import { useGoalSearch } from '@/hooks/useGoalSearch';
import { StepProps } from './types';
import { PrimaryButton, StepHeader } from './ui';

interface GoalStepProps extends StepProps {
  /** Clears everything downstream of the goal so a new goal gets fresh themes and paths. */
  resetDown: () => Partial<AuraFlowState>;
}

const CUSTOM: GoalRef = { id: 'custom', label: '', category: 'Your goal' };

export function GoalStep({ s, m, update, go, resetDown }: GoalStepProps) {
  const q = s.q.trim();
  const hasQuery = q.length > 0;
  const { results, loading } = useGoalSearch(s.q);
  const customOn = s.goal?.id === 'custom';
  const listTitle = !hasQuery
    ? 'Popular goals'
    : loading ? `Searching for “${q}”…`
    : results.length ? `Goals like “${q}”` : 'No close matches. Go with your own words';

  const pick = (g: GoalRef | null) => update({ goal: g, ...resetDown() });

  const onQuery = (v: string) => {
    // Typing keeps a "my own words" selection (it tracks the text) but not a catalogue pick.
    const keep = customOn ? (v.trim() ? CUSTOM : null) : s.goal;
    update({ q: v, ...resetDown(), goal: keep });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !hasQuery) return;
    e.preventDefault();
    pick(results[0] ?? CUSTOM);
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      <StepHeader
        eyebrow="Step 1 of 7 · Your goal"
        title={<>{s.name.trim() ? `${s.name.trim()}, ` : ''}what do you want to achieve?</>}
        sub="Search over 1,200 goals, from a summit to an exam to a career move, or go with your own words."
      />

      <div className="relative">
        <label htmlFor="bm-goal" className="sr-only">Search goals or type your own</label>
        <Search className="pointer-events-none absolute left-[22px] top-[21px] h-[22px] w-[22px] text-bm-muted" aria-hidden />
        <input
          id="bm-goal"
          value={s.q}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          maxLength={120}
          placeholder="Try “climb a mountain”, “pass my driving test”, “get promoted”…"
          className="h-16 w-full rounded-full border-[1.5px] border-bm-ink bg-bm-paper pl-[58px] pr-16 text-lg text-bm-ink outline-none focus:outline-2 focus:outline-offset-1 focus:outline-bm-green"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => update({ q: '', goal: customOn ? null : s.goal, ...resetDown() })}
            aria-label="Clear search"
            className="absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-bm-sand text-bm-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {hasQuery && (
        <button
          type="button"
          onClick={() => pick(customOn ? null : CUSTOM)}
          aria-pressed={customOn}
          className={cn(
            'flex items-center gap-4 rounded-[14px] border-[1.5px] px-5 py-3.5 text-left',
            customOn ? 'border-solid border-bm-green bg-bm-green text-bm-paper' : 'border-dashed border-bm-stone bg-bm-paper text-bm-ink',
          )}
        >
          <Pencil className="h-[22px] w-[22px] shrink-0" aria-hidden />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className={cn('text-[11px] font-bold uppercase tracking-[0.08em]', customOn ? 'text-bm-green-pale' : 'text-bm-muted')}>
              Use my own words
            </span>
            <span className="truncate font-display text-2xl leading-tight">“{q}”</span>
          </span>
        </button>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-bm-muted" aria-live="polite">{listTitle}</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {loading && results.length === 0
            ? Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-[14px] border border-bm-line bg-bm-sand" aria-hidden />
            ))
            : results.map((g) => {
              const on = s.goal?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => pick(on ? null : g)}
                  aria-pressed={on}
                  className={cn(
                    'flex min-h-[84px] animate-fade-in flex-col items-start justify-between gap-2.5 rounded-[14px] border px-4 py-[13px] text-left',
                    on ? 'border-bm-green bg-bm-green text-bm-paper' : 'border-bm-line bg-bm-paper text-bm-ink hover:border-bm-stone',
                    loading && 'opacity-60',
                  )}
                >
                  <span className={cn('text-[11px] font-bold uppercase tracking-[0.08em]', on ? 'text-bm-green-pale' : 'text-bm-muted')}>{g.category}</span>
                  <span className="font-display text-[22px] leading-[1.05]">{g.label}</span>
                </button>
              );
            })}
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between gap-4 border-t border-bm-line pt-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-bm-muted">Your goal</span>
          <span className="truncate font-display text-[22px]">{m.has ? m.title : 'Search, pick a goal, or type your own'}</span>
        </div>
        <PrimaryButton onClick={() => go(2)} disabled={!m.has}>Continue</PrimaryButton>
      </footer>
    </div>
  );
}
