import { useEffect, useState } from 'react';
import { buildReport } from '@/lib/auraFlow';
import { StepProps } from './types';
import { Chip, PrimaryButton, StepFooter, StepHeader } from './ui';

/** Types `text` out a few characters per frame; restarts when the text changes. */
function useTyped(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => {
      setN((c) => {
        if (c + 3 >= text.length) clearInterval(id);
        return Math.min(c + 3, text.length);
      });
    }, 16);
    return () => clearInterval(id);
  }, [text]);
  return { typed: text.slice(0, n), done: n >= text.length };
}

export function InsightsStep({ s, m, update, go }: StepProps) {
  const report = buildReport(s, m);
  const { typed, done } = useTyped(report.summary);

  return (
    <div className="flex min-h-full flex-col gap-[22px]">
      <StepHeader eyebrow="Step 5 of 7 · Insights" title="Your reality report" />

      <div
        className="min-h-[150px] rounded-2xl border border-bm-line bg-bm-paper px-7 py-6 font-display text-[22px] leading-[1.32] md:text-[25px]"
        aria-live="polite"
      >
        {typed}
        {!done && <span className="animate-pulse text-bm-green" aria-hidden>▍</span>}
      </div>

      {done && (
        <div className="flex animate-fade-up flex-col gap-5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-[14px] bg-bm-green-soft px-5 py-[18px]">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-bm-green">What’s working</div>
              <div className="text-[15px] leading-normal">{report.working}</div>
            </div>
            <div className="flex flex-col gap-2 rounded-[14px] bg-bm-amber px-5 py-[18px]">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-bm-amber-ink">Watch-outs</div>
              <div className="text-[15px] leading-normal">{report.watchOuts}</div>
            </div>
            <div className="flex flex-col gap-2 rounded-[14px] border border-bm-line bg-bm-paper px-5 py-[18px]">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-bm-muted">What drives you</div>
              <div className="text-[15px] leading-normal">{report.drives}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold">Does this sound like you?</span>
            <Chip on={s.accurate === 'yes'} onClick={() => update({ accurate: 'yes' })} className="h-11 px-[18px]">Yes, spot on</Chip>
            <Chip on={s.accurate === 'no'} onClick={() => update({ accurate: 'no' })} className="h-11 px-[18px]">Not quite</Chip>
            <span className="text-sm text-bm-muted">
              {s.accurate === 'yes' && 'Great. This becomes the brief for your path.'}
              {s.accurate === 'no' && 'Thanks. The deeper assessments on your dashboard will sharpen this once your path is set.'}
            </span>
          </div>
        </div>
      )}

      <StepFooter onBack={() => go(4)}>
        <PrimaryButton onClick={() => go(6)} disabled={!done}>See my path options</PrimaryButton>
      </StepFooter>
    </div>
  );
}
