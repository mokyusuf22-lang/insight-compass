import { MapPin, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildPaths, locationLabel, recommendedPathIdx } from '@/lib/auraFlow';
import { StepProps } from './types';
import { PrimaryButton, StepFooter, StepHeader } from './ui';

interface PathsStepProps extends StepProps {
  planStatus: 'idle' | 'loading' | 'error';
  onRetryPlan: () => void;
}

export function PathsStep({ s, m, update, go, planStatus, onRetryPlan }: PathsStepProps) {
  const paths = buildPaths(s, m);
  const rec = recommendedPathIdx(s);
  const loading = planStatus === 'loading';
  const firstPhase = m.goal?.phases[0];
  const where = locationLabel(s.location);

  return (
    <div className="flex min-h-full flex-col gap-6">
      <StepHeader
        eyebrow="Step 6 of 7 · Your path"
        title="Three ways to get there"
        sub="Same destination, different pace. Aura has marked the one that fits what you told it."
      />

      {loading && (
        <div role="status" className="flex items-center gap-3 rounded-[14px] bg-bm-green-soft px-5 py-3.5 text-[15px] text-bm-green">
          <span className="h-3 w-3 animate-pulse rounded-full bg-bm-green" aria-hidden />
          Aura is writing your step-by-step plan{where ? ` for ${where}` : ''}…
        </div>
      )}
      {planStatus === 'error' && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-bm-amber px-5 py-3.5 text-[15px] text-bm-amber-ink">
          <span>We couldn’t tailor your tasks just now, so this is a general plan.</span>
          <button type="button" onClick={onRetryPlan} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-2">
            <RotateCcw className="h-4 w-4" aria-hidden /> Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {paths.map((p, i) => {
          const on = s.pathIdx === i;
          return (
            <div
              key={p.name}
              className={cn(
                'relative flex flex-col gap-3 rounded-[18px] border border-bm-line p-[22px]',
                on ? 'bg-bm-green-soft shadow-[0_0_0_2px_#1F5A43]' : 'bg-bm-paper',
              )}
            >
              <div className="flex h-6">
                {i === rec && (
                  <span className="rounded-full bg-bm-gold px-2.5 py-1 text-xs font-bold text-bm-gold-ink">Aura recommends</span>
                )}
              </div>
              <div className="font-display text-[32px] leading-none">{p.name}</div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-[22px] font-bold">{p.weeks} weeks</span>
                <span className="text-sm text-bm-muted">{p.cadence}</span>
              </div>
              <div className="text-sm leading-normal text-bm-muted lg:min-h-[63px]">{p.desc}</div>
              <div className="flex flex-col gap-2 border-t border-bm-line pt-3" aria-busy={loading}>
                {loading
                  ? [0, 1, 2].map((k) => <div key={k} className="h-5 animate-pulse rounded bg-bm-track" aria-hidden />)
                  : p.phases.map((ph) => (
                    <div key={ph.name} className="flex justify-between gap-2 text-sm">
                      <span className="font-semibold">{ph.name}</span>
                      <span className="whitespace-nowrap text-bm-muted">{ph.range}</span>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => update({
                  pathIdx: i,
                  // The coach-guided path implies a coach; switching away from it drops back to self-directed.
                  support: i === 2 ? 'coach' : s.support === 'coach' ? 'self' : s.support,
                })}
                className={cn('mt-1 h-[46px] rounded-full text-[15px] font-semibold text-bm-paper', on ? 'bg-bm-green' : 'bg-bm-ink')}
              >
                {on ? 'Selected' : 'Choose this path'}
              </button>
            </div>
          );
        })}
      </div>

      {!loading && firstPhase && (
        <section aria-labelledby="first-steps" className="flex flex-col gap-3">
          <h2 id="first-steps" className="m-0 text-[13px] font-bold uppercase tracking-[0.08em] text-bm-muted">
            First steps · {firstPhase.title}
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
            {firstPhase.tasks.map((t) => (
              <li key={t.title} className="flex flex-col gap-1.5 rounded-[14px] border border-bm-line bg-bm-paper px-5 py-4">
                <span className="text-[15px] font-semibold">{t.title}</span>
                {t.description && <span className="text-sm leading-normal text-bm-muted">{t.description}</span>}
                {t.where && (
                  <span className="flex gap-1.5 text-sm leading-normal text-bm-green">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{t.where}</span>
                  </span>
                )}
                {t.costNote && <span className="text-xs text-bm-muted">Typical cost: {t.costNote}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <StepFooter onBack={() => go(5)}>
        <PrimaryButton onClick={() => go(7)} disabled={s.pathIdx === null}>Continue</PrimaryButton>
      </StepFooter>
    </div>
  );
}
