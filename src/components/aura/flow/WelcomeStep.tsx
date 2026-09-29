import { StepProps } from './types';
import { Wordmark } from './ui';

const HOW_IT_WORKS = [
  ['Choose your goal', 'Pick from a list or write your own. Any goal, any size.'],
  ['Aura gets to know you', 'A few quick check-ins on your life, style and values.'],
  ['Get an honest picture', 'Your reality report: what’s working, what could trip you up.'],
  ['Follow your path', 'Weekly tasks, progress tracking and a coach in your corner.'],
];

export function WelcomeStep({ s, update, go }: StepProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 px-6 py-10 md:px-16 md:py-14">
        <Wordmark className="text-[34px]" />
        <div className="flex flex-col gap-6">
          <h1 className="m-0 font-display text-5xl font-normal leading-[0.98] tracking-[-0.015em] md:text-[72px]">
            Pick a goal.<br />
            <em className="text-bm-green">Become</em> the person who gets there.
          </h1>
          <p className="m-0 max-w-[480px] text-lg leading-relaxed text-bm-muted">
            Climb a mountain, pass a test, change careers. Be:More learns how you work, then builds a step-by-step
            path with AI and, if you want one, a human coach.
          </p>
          <form
            className="flex max-w-[480px] flex-col gap-2.5"
            onSubmit={(e) => { e.preventDefault(); go(1); }}
          >
            <label htmlFor="bm-name" className="text-sm font-semibold">What should we call you?</label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                id="bm-name"
                value={s.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Your first name"
                autoComplete="given-name"
                className="h-[52px] min-w-0 flex-grow rounded-full border border-bm-edge bg-bm-paper px-[18px] text-base text-bm-ink outline-none focus:outline-2 focus:outline-offset-1 focus:outline-bm-green"
              />
              <button type="submit" className="h-[52px] rounded-full bg-bm-ink px-[26px] text-base font-semibold text-bm-paper hover:bg-black">
                Let’s start
              </button>
            </div>
          </form>
        </div>
        <p className="m-0 text-[13px] text-bm-muted">About 5 minutes · You can take the deeper assessments later</p>
      </div>
      <div className="flex flex-col justify-center gap-8 bg-bm-green px-6 py-12 text-bm-paper md:px-16 md:py-[72px]">
        <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-bm-green-pale">How it works</div>
        <ol className="m-0 flex list-none flex-col gap-7 p-0">
          {HOW_IT_WORKS.map(([title, body], i) => (
            <li key={title} className="flex items-baseline gap-[22px]">
              <span className="w-8 font-display text-[44px] leading-none text-bm-gold">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <div className="text-xl font-semibold">{title}</div>
                <div className="text-[15px] leading-normal text-bm-green-mist">{body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
