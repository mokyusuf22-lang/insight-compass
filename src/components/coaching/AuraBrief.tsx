import { Compass } from 'lucide-react';
import { HOURS, LEVELS, STYLES, TIMELINES, type AuraFlowState } from '@/lib/auraFlow';

/** aura_sessions.flow_data as stored by the Aura flow (older sessions may lack fields). */
export type AuraBriefData = Partial<AuraFlowState> & {
  location?: { country?: string; city?: string } | null;
};

const PATH_NAMES = ['Steady climb', 'Focused sprint', 'Coach-guided'];
const label = (opts: { v: number; label: string }[], v?: number | null) => opts.find((o) => o.v === v)?.label;

/** What the client told Aura, laid out for their coach. */
export function AuraBrief({ data, goal }: { data: AuraBriefData; goal: string | null }) {
  const loc = data.location ? [data.location.city, data.location.country].filter(Boolean).join(', ') : '';
  const style = STYLES.find((s) => s.k === data.style);
  const wheel = data.wheel ? Object.entries(data.wheel).filter(([, v]) => v > 0) : [];

  const facts: [string, string | undefined][] = [
    ['Goal', goal ?? undefined],
    ['Location', loc || undefined],
    ['Starting point', label(LEVELS, data.level)],
    ['Timeline', label(TIMELINES, data.timeline)],
    ['Time per week', label(HOURS, data.hours)],
    ['Gets in the way', data.obstacles?.length ? data.obstacles.join(', ') : undefined],
    ['Working style', style ? `${style.name}: “${style.desc}”` : undefined],
    ['Driven by', data.values?.length ? data.values.join(', ') : undefined],
    ['Chosen path', data.pathIdx != null ? PATH_NAMES[data.pathIdx] : undefined],
    ['Starts', data.start ?? undefined],
    ['Why it matters', data.pledge?.trim() || undefined],
  ];

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-card">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Compass className="w-4 h-4 text-accent" />
        Aura brief
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-foreground mb-2 sm:mb-0">{v}</dd>
          </div>
        ))}
      </dl>
      {wheel.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Life balance (1–5)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {wheel.map(([area, v]) => (
              <div key={area} className="bg-secondary/40 rounded-lg px-3 py-2 flex justify-between text-sm">
                <span>{area}</span>
                <span className={v <= 2 ? 'text-destructive font-semibold' : 'font-semibold'}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
