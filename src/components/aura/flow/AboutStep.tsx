import { useMemo } from 'react';
import { HOURS, LEVELS, OBSTACLES, TIMELINES } from '@/lib/auraFlow';
import { getCountries, guessCountryCode } from '@/data/countries';
import { StepProps } from './types';
import { Chip, PrimaryButton, StepFooter, StepHeader } from './ui';

type NumKey = 'level' | 'timeline' | 'hours';

const fieldClass =
  'h-[46px] rounded-full border border-bm-line bg-bm-paper px-5 text-[15px] text-bm-ink outline-none focus:outline-2 focus:outline-offset-1 focus:outline-bm-green';

export function AboutStep({ s, update, go }: StepProps) {
  const countries = useMemo(getCountries, []);
  // Offer the browser's locale as a suggestion at the top of the list, but never pre-fill it.
  const suggested = useMemo(() => {
    const code = guessCountryCode();
    return code ? countries.find((c) => c.code === code) ?? null : null;
  }, [countries]);

  const group = (label: string, key: NumKey, opts: { v: number; label: string }[]) => (
    <div className="flex flex-col gap-2.5">
      <div className="text-base font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2.5">
        {opts.map((o) => (
          <Chip key={o.v} on={s[key] === o.v} onClick={() => update({ [key]: o.v })}>{o.label}</Chip>
        ))}
      </div>
    </div>
  );

  const setCountry = (code: string) => {
    const c = countries.find((x) => x.code === code);
    update({ location: c ? { countryCode: c.code, country: c.name, city: s.location?.city ?? '' } : null });
  };

  const ok = !!(s.level && s.timeline && s.hours && s.location?.countryCode);

  return (
    <div className="flex min-h-full flex-col gap-7">
      <StepHeader
        eyebrow="Step 2 of 7 · About you"
        title="Where are you starting from?"
        sub="A few quick answers so Aura can size the plan to your real life, and point you to the right places where you live."
      />
      <div className="flex flex-col gap-[26px]">
        <div className="flex flex-col gap-2.5">
          <div className="text-base font-semibold">Where are you based?</div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <label htmlFor="bm-country" className="sr-only">Country</label>
            <select
              id="bm-country"
              value={s.location?.countryCode ?? ''}
              onChange={(e) => setCountry(e.target.value)}
              className={`${fieldClass} sm:w-72 ${s.location ? '' : 'text-bm-muted'}`}
            >
              <option value="" disabled>Choose your country</option>
              {suggested && <option value={suggested.code}>{suggested.name} (suggested)</option>}
              {countries.filter((c) => c.code !== suggested?.code).map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <label htmlFor="bm-city" className="sr-only">Town or city (optional)</label>
            <input
              id="bm-city"
              value={s.location?.city ?? ''}
              disabled={!s.location}
              maxLength={80}
              autoComplete="address-level2"
              placeholder="Town or city (optional)"
              onChange={(e) => s.location && update({ location: { ...s.location, city: e.target.value } })}
              className={`${fieldClass} sm:w-72 disabled:opacity-50`}
            />
          </div>
          <p className="m-0 text-sm text-bm-muted">Used to point you to the right official bodies and how to find local options. Aura never names businesses.</p>
        </div>
        {group('How far along are you?', 'level', LEVELS)}
        {group('When do you want to get there?', 'timeline', TIMELINES)}
        {group('How much time can you give it each week?', 'hours', HOURS)}
        <div className="flex flex-col gap-2.5">
          <div className="text-base font-semibold">
            What usually gets in the way? <span className="font-normal text-bm-muted">Pick any</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {OBSTACLES.map((o) => {
              const on = s.obstacles.includes(o);
              return (
                <Chip
                  key={o}
                  on={on}
                  onClick={() => update({ obstacles: on ? s.obstacles.filter((x) => x !== o) : [...s.obstacles, o] })}
                >
                  {o}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>
      <StepFooter onBack={() => go(1)}>
        <PrimaryButton onClick={() => go(3)} disabled={!ok}>Send to Aura</PrimaryButton>
      </StepFooter>
    </div>
  );
}
