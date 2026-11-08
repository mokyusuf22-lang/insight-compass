import { cn } from '@/lib/utils';
import { buildPaths, recommendedPathIdx, START_OPTIONS, Support } from '@/lib/auraFlow';
import { PRIMARY_COACH } from '@/lib/coachProfile';
import { CoachCard } from '@/components/coaching/CoachCard';
import { StepProps } from './types';
import { Chip, PrimaryButton, SelectCard, StepFooter, StepHeader } from './ui';

const SUPPORT: { k: Support; name: string; desc: string }[] = [
  { k: 'self', name: 'Self-directed with Aura', desc: 'Aura plans your weeks, nudges you and adapts the path as you log progress.' },
  { k: 'coach', name: `With ${PRIMARY_COACH.name}, your coach`, desc: `${PRIMARY_COACH.name} reviews your path weekly, messages you and adjusts it with you.` },
];

export function CommitStep({ s, m, update, go, saving, planLoading, onCommit }: StepProps & {
  saving: boolean;
  /** Still generating the tailored plan: committing now would save the general one. */
  planLoading: boolean;
  onCommit: () => void;
}) {
  const chosen = buildPaths(s, m)[s.pathIdx ?? recommendedPathIdx(s)];
  const ok = !!(s.start && s.support);

  return (
    <div className="flex min-h-full flex-col gap-6">
      <StepHeader eyebrow="Step 7 of 7 · Commit" title="Make it real" />
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5 rounded-[18px] bg-bm-orange p-6 text-bm-paper">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-bm-orange-pale">You’re committing to</div>
          <div className="font-serif text-[34px] leading-[1.05]">{m.title}</div>
          <div className="text-[15px] text-bm-orange-mist">{chosen.name} · {chosen.weeks} weeks · {chosen.cadence}</div>
          <div className="flex flex-col gap-2.5 border-t border-white/30 pt-3.5">
            {chosen.phases.map((ph) => (
              <div key={ph.name} className="flex justify-between gap-2 text-sm">
                <span className="font-semibold">{ph.name}</span>
                <span className="text-bm-orange-pale">{ph.range}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-semibold">When do you start?</div>
            <div className="flex flex-wrap gap-2.5">
              {START_OPTIONS.map((o) => (
                <Chip key={o} on={s.start === o} onClick={() => update({ start: o })}>{o}</Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-semibold">Who’s in your corner?</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SUPPORT.map((o) => {
                const on = s.support === o.k;
                return (
                  <SelectCard key={o.k} on={on} onClick={() => update({ support: o.k })} className="gap-1.5 px-[18px] py-4">
                    <span className="text-base font-bold">{o.name}</span>
                    <span className={cn('text-sm leading-[1.45]', on ? 'text-bm-orange-mist' : 'text-bm-muted')}>{o.desc}</span>
                  </SelectCard>
                );
              })}
            </div>
            {s.support === 'coach' && (
              <>
                <CoachCard compact className="border-bm-line bg-bm-paper" />
                <p className="m-0 text-[13px] leading-snug text-bm-muted">
                  By choosing coaching you agree that {PRIMARY_COACH.name} can see your goal, Aura answers, plan,
                  progress and messages. You can stop coaching at any time.
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="bm-why" className="text-base font-semibold">
              Why does this matter to you? <span className="font-normal text-bm-muted">Optional, one line</span>
            </label>
            <input
              id="bm-why"
              value={s.pledge}
              onChange={(e) => update({ pledge: e.target.value })}
              maxLength={200}
              placeholder="e.g. To prove to myself I can do hard things"
              className="h-[50px] rounded-xl border border-bm-edge bg-bm-paper px-4 text-base text-bm-ink outline-none focus:outline-2 focus:outline-offset-1 focus:outline-bm-orange"
            />
          </div>
        </div>
      </div>
      <StepFooter onBack={() => go(6)}>
        <PrimaryButton onClick={onCommit} disabled={!ok || saving || planLoading}>
          {saving ? 'Saving your path…' : planLoading ? 'Finishing your plan…' : 'I’m committing to this'}
        </PrimaryButton>
      </StepFooter>
    </div>
  );
}
