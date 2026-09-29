import { cn } from '@/lib/utils';
import { STYLES, VALUES } from '@/lib/auraFlow';
import { StepProps } from './types';
import { PrimaryButton, SelectCard, StepFooter, StepHeader } from './ui';

const TABS = ['1 · Life balance', '2 · Working style', '3 · What drives you'];
const TITLES = ['How balanced does life feel?', 'How do you work best?', 'What drives you?'];
const SUBS = [
  'Rate each area from 1 to 5. Aura uses this to spot what will support or squeeze your goal.',
  'Pick the one that sounds most like you. It shapes how your plan is paced and how you get nudged.',
  'Choose up to three. Your milestones will be framed around them.',
];

export function CheckInsStep({ s, update, go }: StepProps) {
  const domains = Object.keys(s.wheel);
  const wheelDone = domains.every((d) => s.wheel[d] > 0);
  const done = [wheelDone, !!s.style, s.values.length > 0];
  const unlocked = [true, wheelDone, wheelDone && !!s.style];
  const idx = s.checkIdx;

  return (
    <div className="flex min-h-full flex-col gap-6">
      <StepHeader eyebrow={`Step 4 of 7 · Check-in ${idx + 1} of 3`} title={TITLES[idx]} sub={SUBS[idx]} />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Check-ins">
        {TABS.map((label, i) => {
          const cur = idx === i;
          const complete = done[i] && !cur;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={cur}
              disabled={!unlocked[i]}
              onClick={() => update({ checkIdx: i })}
              className={cn(
                'flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed',
                cur ? 'border-bm-ink bg-bm-ink text-bm-paper'
                  : complete ? 'border-bm-green-soft bg-bm-green-soft text-bm-green'
                  : unlocked[i] ? 'border-bm-line bg-transparent text-bm-ink' : 'border-bm-line bg-transparent text-bm-muted',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {idx === 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-10">
          {domains.map((d) => (
            <div key={d} className="flex flex-col gap-2.5 rounded-[14px] border border-bm-line bg-bm-paper px-[18px] py-4">
              <div className="flex justify-between text-base font-semibold">
                <span>{d}</span>
                <span className="text-bm-green">{s.wheel[d] ? `${s.wheel[d]} / 5` : 'Not rated'}</span>
              </div>
              <div className="flex gap-2.5" role="radiogroup" aria-label={d}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = n <= s.wheel[d];
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={s.wheel[d] === n}
                      aria-label={`${d}: ${n} out of 5`}
                      onClick={() => update({ wheel: { ...s.wheel, [d]: n } })}
                      className={cn(
                        'h-11 w-11 rounded-full border-[1.5px] text-sm font-bold',
                        on ? 'border-bm-green bg-bm-green text-bm-paper' : 'border-bm-line bg-bm-paper text-bm-ink',
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {idx === 1 && (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {STYLES.map((c) => {
            const on = s.style === c.k;
            return (
              <SelectCard key={c.k} on={on} onClick={() => update({ style: c.k })} className="gap-2 px-6 py-[22px]">
                <span className="font-display text-[32px] leading-none">{c.name}</span>
                <span className={cn('text-base leading-normal', on ? 'text-bm-green-mist' : 'text-bm-muted')}>“{c.desc}”</span>
              </SelectCard>
            );
          })}
        </div>
      )}

      {idx === 2 && (
        <div className="flex flex-col gap-3.5">
          <div className="text-[15px] font-semibold text-bm-muted">Pick up to 3 · {s.values.length} of 3 chosen</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {VALUES.map((v) => {
              const on = s.values.includes(v);
              const full = !on && s.values.length >= 3;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  aria-disabled={full}
                  onClick={() => {
                    if (on) update({ values: s.values.filter((x) => x !== v) });
                    else if (!full) update({ values: [...s.values, v] });
                  }}
                  className={cn(
                    'h-16 rounded-[14px] border font-display text-2xl',
                    on ? 'border-bm-green bg-bm-green text-bm-paper'
                      : full ? 'cursor-not-allowed border-bm-line bg-bm-paper text-bm-muted'
                      : 'border-bm-line bg-bm-paper text-bm-ink hover:border-bm-stone',
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <StepFooter onBack={() => (idx > 0 ? update({ checkIdx: idx - 1 }) : go(3))}>
        <PrimaryButton
          disabled={!done[idx]}
          onClick={() => (idx < 2 ? update({ checkIdx: idx + 1 }) : go(5))}
        >
          {idx < 2 ? 'Next check-in' : 'See my insights'}
        </PrimaryButton>
      </StepFooter>
    </div>
  );
}
