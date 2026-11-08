import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getCookieChoice, OPEN_COOKIE_SETTINGS_EVENT, setCookieChoice } from '@/lib/consent';

/**
 * Shown until the visitor chooses. "Reject" is as easy as "Accept" (UK ICO / EU guidance),
 * nothing non-essential loads before a choice, and "Cookie settings" in the footer reopens it.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(() => !getCookieChoice());
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(() => getCookieChoice()?.analytics ?? false);
  const [ads, setAds] = useState(() => getCookieChoice()?.ads ?? false);

  useEffect(() => {
    const reopen = () => {
      const c = getCookieChoice();
      setAnalytics(c?.analytics ?? false);
      setAds(c?.ads ?? false);
      setManage(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const decide = (a: boolean, d: boolean) => {
    setCookieChoice(a, d);
    setOpen(false);
    setManage(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6">
        <h2 id="cookie-title" className="mb-1.5 font-sans text-base font-bold">Cookies on Be:More</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use essential cookies to keep you signed in. With your permission we’d also like to use Google
          Analytics to understand how the site is used, and Google advertising cookies to measure our ads.
          See our <Link to="/cookies" className="underline hover:text-foreground">cookie policy</Link>.
        </p>

        {manage && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <CookieRow
              id="ck-essential"
              title="Essential"
              desc="Sign-in and security. Always on, because the site can’t work without them."
              checked
              disabled
            />
            <CookieRow
              id="ck-analytics"
              title="Analytics"
              desc="Google Analytics: which pages are used and where people get stuck. No answers or goals are sent."
              checked={analytics}
              onChange={setAnalytics}
            />
            <CookieRow
              id="ck-ads"
              title="Advertising"
              desc="Google Ads: measures whether our adverts work and may personalise ads you see elsewhere."
              checked={ads}
              onChange={setAds}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {manage ? (
            <Button className="rounded-full" onClick={() => decide(analytics, ads)}>Save choices</Button>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full" onClick={() => setManage(true)}>Manage</Button>
              <Button variant="outline" className="rounded-full" onClick={() => decide(false, false)}>Reject all</Button>
              <Button className="rounded-full" onClick={() => decide(true, true)}>Accept all</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CookieRow({ id, title, desc, checked, disabled, onChange }: {
  id: string; title: string; desc: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{desc}</span>
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
