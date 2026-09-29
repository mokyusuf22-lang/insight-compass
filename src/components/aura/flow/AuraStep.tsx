import { auraSummary } from '@/lib/auraFlow';
import { StepProps } from './types';
import { PrimaryButton, StepFooter, StepHeader } from './ui';

const CHECK_INS = ['Life balance', 'Working style', 'What drives you'];

export function AuraStep({ s, m, go, analysing, onConfirm }: StepProps & { analysing: boolean; onConfirm: () => void }) {
  const themes = m.goal?.themes ?? [];

  return (
    <div className="flex min-h-full flex-col gap-[26px]">
      <StepHeader
        eyebrow="Step 3 of 7 · Aura"
        title={analysing ? 'Aura is reading your goal…' : 'Here’s what Aura heard'}
        sub="Aura pulls out the themes that matter for this goal, then picks the check-ins that will tell it the most about you."
      />

      {analysing ? (
        <div className="flex flex-grow flex-col items-center justify-center gap-7 py-10" role="status" aria-live="polite">
          <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-bm-green">
            <div className="h-10 w-10 rounded-full bg-bm-gold" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center text-[15px] text-bm-muted">
            <div className="text-lg font-semibold text-bm-ink">Reading “{m.title}”</div>
            <div>Finding the themes that matter · Matching check-ins to you</div>
          </div>
        </div>
      ) : (
        <div className="flex animate-fade-up flex-col gap-[22px]">
          <div className="rounded-2xl border border-bm-line bg-bm-paper px-[26px] py-[22px] font-display text-[22px] leading-[1.3] md:text-[25px]">
            {auraSummary(s, m)}
          </div>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {themes.map(([area, conf, why]) => (
              <div key={area} className="flex flex-col gap-2.5 rounded-[14px] border border-bm-line bg-bm-paper px-5 py-[18px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-bold">{area}</span>
                  <span className="whitespace-nowrap text-[13px] font-semibold text-bm-green">{conf}% match</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-bm-track">
                  <div className="h-1.5 rounded-[3px] bg-bm-green" style={{ width: `${conf}%` }} />
                </div>
                <div className="text-sm leading-normal text-bm-muted">{why}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] font-semibold">Aura picked 3 check-ins for you · about 3 minutes</span>
            {CHECK_INS.map((c) => (
              <span key={c} className="rounded-full bg-bm-green-soft px-3.5 py-1.5 text-sm font-semibold text-bm-green">{c}</span>
            ))}
          </div>
        </div>
      )}

      <StepFooter onBack={() => go(2)}>
        <PrimaryButton onClick={onConfirm} disabled={analysing}>That’s right, start check-ins</PrimaryButton>
      </StepFooter>
    </div>
  );
}
