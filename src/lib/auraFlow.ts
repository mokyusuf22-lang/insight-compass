// Aura onboarding flow — state shape, answer options, report composer and path builder.
// Goals come from the `goals` catalogue (search_goals RPC). Themes and the step-by-step,
// location-aware plan come from the `aura-plan` edge function; if that is unavailable,
// the generic themes/phases below keep the flow working.

export type Theme = [area: string, confidence: number, why: string];

export interface PlanTask {
  title: string;
  description: string;
  /** Where/how to do this in the user's location. Empty when location doesn't matter. */
  where: string;
  instructions: string[];
  successCriteria: string;
  estimatedMinutes: number;
  /** Rough local-currency cost range, or empty. */
  costNote: string;
}

export interface PlanPhase { title: string; tasks: PlanTask[] }

/** A catalogue goal as picked by the user ('custom' means "use my own words"). */
export interface GoalRef { id: string; label: string; category: string }

export interface UserLocation { countryCode: string; country: string; city: string }

export interface Goal {
  id: string;
  cat: string;
  label: string;
  themes: Theme[];
  phases: PlanPhase[];
}

export type WorkingStyle = 'D' | 'I' | 'S' | 'C';
export type Support = 'self' | 'coach';

export interface AuraFlowState {
  step: number;
  maxStep: number;
  name: string;
  q: string;
  goal: GoalRef | null;
  level: number | null;
  timeline: number | null;
  hours: number | null;
  obstacles: string[];
  location: UserLocation | null;
  /** AI themes and the inputs they were generated from (so a reload doesn't re-spend). */
  aiThemes: Theme[] | null;
  themesKey: string | null;
  /** AI plan and the inputs it was generated from. */
  plan: { key: string; phases: PlanPhase[] } | null;
  checkIdx: number;
  wheel: Record<string, number>;
  style: WorkingStyle | null;
  values: string[];
  accurate: 'yes' | 'no' | null;
  pathIdx: number | null;
  start: string | null;
  support: Support | null;
  pledge: string;
}

export const WHEEL_DOMAINS = ['Health', 'Work or study', 'Money', 'Relationships', 'Fun & rest', 'Growth'];

export function freshFlowState(name = ''): AuraFlowState {
  return {
    step: 0, maxStep: 0, name, q: '', goal: null,
    level: null, timeline: null, hours: null, obstacles: [], location: null,
    aiThemes: null, themesKey: null, plan: null,
    checkIdx: 0,
    wheel: Object.fromEntries(WHEEL_DOMAINS.map((d) => [d, 0])),
    style: null, values: [], accurate: null,
    pathIdx: null, start: null, support: null, pledge: '',
  };
}

export const STEP_LABELS = ['Your goal', 'About you', 'Aura', 'Check-ins', 'Insights', 'Your path', 'Commit'];

// ── Generic fallbacks (used until/unless the AI answers) ─────
const genericThemes = (label: string): Theme[] => [
  ['A clear finish line', 80, `Turning “${label}” into something you can measure and tick off.`],
  ['Consistent action', 72, 'Small weekly steps you can keep up when life gets busy.'],
  ['Support and accountability', 60, 'Someone checking in makes you far more likely to follow through.'],
];

const task = (title: string, description = '', where = ''): PlanTask => ({
  title, description, where, instructions: [], successCriteria: '', estimatedMinutes: 30, costNote: '',
});

const genericPhases = (): PlanPhase[] => [
  { title: 'Define', tasks: [
    task('Write down what “done” looks like', 'Describe the finish line in one or two sentences so you know when you’ve made it.'),
    task('Break it into three milestones', 'Pick three checkpoints between today and your goal.'),
    task('Block weekly time in your calendar', 'Protect the hours you said you can give it.'),
  ] },
  { title: 'Build', tasks: [
    task('Complete milestone one'),
    task('Tell one person about your goal', 'Saying it out loud makes you more likely to follow through.'),
    task('Review what is slowing you down'),
  ] },
  { title: 'Finish', tasks: [
    task('Complete milestones two and three'),
    task('Celebrate and reflect'),
    task('Decide what comes next'),
  ] },
];

const cap = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
/** Lower-case the first letter unless it looks like an acronym ("ACCA exam"). */
const lcFirst = (t: string) => {
  if (!t) return t;
  if (t.length > 1 && t[1] === t[1].toUpperCase() && t[1] !== t[1].toLowerCase()) return t;
  return t[0].toLowerCase() + t.slice(1);
};
export const joinList = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

export interface ResolvedGoal {
  has: boolean;
  goal: Goal | null;
  title: string;
  lower: string;
}

export function resolveGoal(s: AuraFlowState): ResolvedGoal {
  const custom = s.goal?.id === 'custom';
  const label = custom ? s.q.trim() : s.goal?.label ?? '';
  if (!s.goal || !label) return { has: false, goal: null, title: '', lower: '' };
  const title = cap(label);
  return {
    has: true,
    title,
    lower: lcFirst(label),
    goal: {
      id: s.goal.id,
      cat: custom ? 'Your goal' : s.goal.category,
      label: title,
      themes: s.aiThemes?.length ? s.aiThemes : genericThemes(title),
      phases: s.plan?.phases.length ? s.plan.phases : genericPhases(),
    },
  };
}

// ── About you options ───────────────────────────────────────
export const LEVELS = [{ v: 1, label: 'Complete beginner' }, { v: 2, label: 'Tried it before' }, { v: 3, label: 'Part-way there' }, { v: 4, label: 'Nearly there' }];
export const TIMELINES = [{ v: 4, label: '1 month' }, { v: 12, label: '3 months' }, { v: 26, label: '6 months' }, { v: 52, label: '1 year' }];
export const HOURS = [{ v: 2, label: '1–2 hours' }, { v: 4, label: '3–5 hours' }, { v: 8, label: '6–10 hours' }, { v: 12, label: '10+ hours' }];
export const OBSTACLES = ['Time', 'Confidence', 'Motivation', 'Money', 'Know-how', 'Energy'];

export const optionLabel = (arr: { v: number; label: string }[], v: number | null) => arr.find((x) => x.v === v)?.label ?? '';
const LEVEL_PHRASE: Record<number, string> = { 1: 'from scratch', 2: 'with a little experience', 3: 'part-way there', 4: 'close to the finish' };
export const locationLabel = (loc: UserLocation | null) => (loc ? [loc.city, loc.country].filter(Boolean).join(', ') : '');

// ── Check-ins ───────────────────────────────────────────────
export const STYLES: { k: WorkingStyle; name: string; desc: string }[] = [
  { k: 'D', name: 'Driver', desc: 'I like to move fast, decide quickly and see results.' },
  { k: 'I', name: 'Connector', desc: 'I get my energy from people and sharing the journey.' },
  { k: 'S', name: 'Steady', desc: 'Once a routine clicks, I stick with it. I like a rhythm.' },
  { k: 'C', name: 'Planner', desc: 'I want the detail, a clear plan and to get it right.' },
];
const STYLE_INFO: Record<WorkingStyle, [string, string, string]> = {
  D: ['Driver', 'you build momentum fast', 'short, measurable weekly targets will keep you going'],
  I: ['Connector', 'you find support easily', 'sharing progress and doing it with others will keep you going'],
  S: ['Steady', 'you stick with things', 'a fixed weekly rhythm matters more than intensity'],
  C: ['Planner', 'you prepare well', 'a clear plan with checkpoints will keep you confident'],
};
export const VALUES = ['Freedom', 'Growth', 'Health', 'Family', 'Achievement', 'Adventure', 'Security', 'Creativity', 'Recognition'];

export function auraSummary(s: AuraFlowState, m: ResolvedGoal): string {
  if (!m.has) return '';
  const obs = s.obstacles.map((o) => o.toLowerCase());
  const where = locationLabel(s.location);
  return `“You want to ${m.lower}${where ? `, based in ${where}` : ''}. You’re starting ${LEVEL_PHRASE[s.level ?? 1]}, with ${optionLabel(HOURS, s.hours) || '3–5 hours'} a week and ${optionLabel(TIMELINES, s.timeline) || '3 months'} to get there${obs.length ? `, and ${joinList(obs)} could get in the way` : ''}.”`;
}

// ── aura-plan request payloads and cache keys ───────────────
export function themesRequest(s: AuraFlowState, m: ResolvedGoal) {
  return {
    goal: { label: m.title, category: m.goal?.cat ?? '' },
    about: {
      level: optionLabel(LEVELS, s.level),
      timeline: optionLabel(TIMELINES, s.timeline),
      hours: optionLabel(HOURS, s.hours),
      obstacles: s.obstacles,
    },
    location: s.location ?? { country: '', countryCode: '', city: '' },
  };
}

export function planRequest(s: AuraFlowState, m: ResolvedGoal) {
  const style = STYLES.find((x) => x.k === s.style);
  return {
    ...themesRequest(s, m),
    checkins: {
      style: style ? `${style.name}: ${style.desc}` : '',
      values: s.values,
      wheel: s.wheel,
    },
  };
}

export const requestKey = (payload: unknown) => JSON.stringify(payload);

// ── Reality report ──────────────────────────────────────────
export interface Report {
  summary: string;
  working: string;
  watchOuts: string;
  drives: string;
}

const RISK: Record<string, string> = {
  Time: 'finding the hours, so sessions are short and scheduled',
  Confidence: 'self-doubt, so early wins are built in',
  Motivation: 'motivation dips, so there is a check-in every week',
  Money: 'cost, so free options come first',
  'Know-how': 'not knowing where to start, so phase one is all fundamentals',
  Energy: 'your energy, so recovery is part of the plan',
};

export function buildReport(s: AuraFlowState, m: ResolvedGoal): Report {
  const style = STYLE_INFO[s.style ?? 'S'];
  const sorted = Object.keys(s.wheel).sort((a, b) => s.wheel[b] - s.wheel[a]);
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const risk = s.obstacles.length ? RISK[s.obstacles[0]] : `your lowest area, ${low.toLowerCase()}, so the plan protects it`;
  const vals = s.values.length ? s.values : ['Growth'];
  const obs = s.obstacles.map((o) => o.toLowerCase());
  const name = s.name.trim();
  return {
    summary: `${name ? `${name}, here’s` : 'Here’s'} the honest picture. You want to ${m.lower}, starting ${LEVEL_PHRASE[s.level ?? 1]} with ${optionLabel(HOURS, s.hours) || '3–5 hours'} a week. As a ${style[0].toLowerCase()}, ${style[2]}. You’re driven by ${joinList(vals.map((v) => v.toLowerCase()))}. Your biggest watch-out is ${risk}.`,
    working: `${top} is your strongest area (${s.wheel[top]}/5). As a ${style[0]}, ${style[1]}.`,
    watchOuts: `${low} is lowest (${s.wheel[low]}/5).${obs.length ? ` You flagged ${joinList(obs)}.` : ''}${m.goal ? ` ${m.goal.themes[1]?.[0] ?? m.goal.themes[0][0]} gets extra attention early.` : ''}`,
    drives: `${joinList(vals)}. Your plan is framed around ${vals.length > 1 ? 'these' : 'this'} so it stays yours.`,
  };
}

// ── Paths ───────────────────────────────────────────────────
export interface PathOption {
  name: string;
  weeks: number;
  cadence: string;
  desc: string;
  phases: { name: string; range: string }[];
}

export function buildPaths(s: AuraFlowState, m: ResolvedGoal): PathOption[] {
  const W = s.timeline || 12;
  const phases = m.goal?.phases ?? [];
  const mk = (name: string, weeks: number, cadence: string, desc: string): PathOption => ({
    name, weeks, cadence, desc,
    phases: phases.map((p, i) => {
      const a = Math.floor((weeks * i) / phases.length) + 1;
      const b = Math.max(a, Math.floor((weeks * (i + 1)) / phases.length));
      return { name: p.title, range: a === b ? `Week ${a}` : `Weeks ${a}–${b}` };
    }),
  });
  return [
    mk('Steady climb', W, '3 sessions a week', 'A pace that fits around life. Best when your weeks are unpredictable.'),
    mk('Focused sprint', Math.max(3, Math.round(W * 0.7)), '5 sessions a week', 'Faster and more intense. Best when you have protected time and want momentum.'),
    mk('Coach-guided', W, '3 sessions + weekly coach call', 'The steady plan, reviewed every week by a human coach who adjusts it with you.'),
  ];
}

export function recommendedPathIdx(s: AuraFlowState): number {
  if (s.obstacles.includes('Confidence') || s.obstacles.includes('Motivation')) return 2;
  return (s.hours ?? 0) >= 8 ? 1 : 0;
}

export const START_OPTIONS = ['Today', 'Next Monday', 'Start of next month'];

/** Shape expected by SkillPath / PhasePage / TaskPage (personal_paths.phases). */
export function toPersonalPathPhases(m: ResolvedGoal, path: PathOption) {
  return (m.goal?.phases ?? []).map((phase, pi) => ({
    id: `phase${pi + 1}`,
    phaseNumber: pi + 1,
    title: phase.title,
    duration: path.phases[pi]?.range ?? '',
    goal: `${phase.title} for “${m.title}”`,
    successDefinition: 'All tasks in this phase are ticked off.',
    tasks: phase.tasks.map((t, ti) => ({
      id: `p${pi + 1}-t${ti + 1}`,
      title: t.title,
      description: t.description,
      where: t.where,
      costNote: t.costNote,
      instructions: t.instructions,
      type: 'practice',
      estimatedMinutes: t.estimatedMinutes,
      status: pi === 0 && ti === 0 ? 'available' : 'locked',
      successCriteria: t.successCriteria,
    })),
  }));
}

// ── Deep-dive assessments (taken after onboarding, from the dashboard) ──
export interface DeepDive {
  id: 'disc' | 'wheel' | 'blob' | 'values' | 'strengths';
  name: string;
  description: string;
  route: string;
  flag: 'disc_completed' | 'wheel_of_life_complete' | 'blob_tree_complete' | 'value_map_complete' | 'strengths_completed';
  keywords: string[];
}

export const DEEP_DIVES: DeepDive[] = [
  { id: 'disc', name: 'Working style (DISC)', description: 'A fuller read on how you work, decide and communicate. Sharpens how your plan is paced.', route: '/assessment/disc', flag: 'disc_completed', keywords: [] },
  { id: 'wheel', name: 'Wheel of Life', description: 'The full version of your life-balance check-in, across eight areas.', route: '/assessment/wheel-of-life', flag: 'wheel_of_life_complete', keywords: ['balance', 'routine', 'health', 'sleep', 'energy', 'time', 'boundaries', 'recovery', 'protected'] },
  { id: 'values', name: 'Values map', description: 'Ranks what matters most so your milestones stay meaningful.', route: '/assessment/value-map', flag: 'value_map_complete', keywords: ['motivation', 'purpose', 'career', 'sponsorship', 'impact', 'finishing', 'consistency', 'habit'] },
  { id: 'blob', name: 'Blob Tree', description: 'A visual check on how you feel about where you are now and where you want to be.', route: '/assessment/blob-tree', flag: 'blob_tree_complete', keywords: ['confidence', 'nerves', 'pressure', 'stress', 'energy', 'calm', 'self'] },
  { id: 'strengths', name: 'Strengths', description: 'Surfaces the strengths to lean on and the gaps to plan around.', route: '/assessment/strengths', flag: 'strengths_completed', keywords: ['skills', 'career', 'technique', 'know-how', 'next-level', 'structure', 'visible'] },
];

/** DISC always, plus any deep-dive whose keywords match the user's themes or obstacles. */
export function recommendedDeepDives(themeAreas: string[], obstacles: string[] = []): Set<DeepDive['id']> {
  const hay = [...themeAreas, ...obstacles].map((t) => t.toLowerCase());
  const out = new Set<DeepDive['id']>(['disc']);
  DEEP_DIVES.forEach((d) => {
    if (d.keywords.some((k) => hay.some((h) => h.includes(k)))) out.add(d.id);
  });
  return out;
}
