// Google Analytics / Ads, loaded only after the user accepts cookies.
// Set VITE_GA_MEASUREMENT_ID (e.g. G-XXXXXXX) in .env / Vercel to turn it on.
// Uses Google Consent Mode v2: everything is "denied" until the cookie banner says otherwise,
// and the gtag script isn't even downloaded until analytics or ads is accepted.
import { COOKIE_CHOICE_EVENT, CookieChoice, getCookieChoice } from './consent';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let loaded = false;

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // gtag expects the arguments object itself.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
  void args;
}

function consentState(c: CookieChoice | null) {
  return {
    analytics_storage: c?.analytics ? 'granted' : 'denied',
    ad_storage: c?.ads ? 'granted' : 'denied',
    ad_user_data: c?.ads ? 'granted' : 'denied',
    ad_personalization: c?.ads ? 'granted' : 'denied',
  };
}

function load(c: CookieChoice) {
  if (!GA_ID || loaded || !(c.analytics || c.ads)) return;
  loaded = true;
  window.gtag = gtag;
  gtag('consent', 'default', { ...consentState(null), wait_for_update: 500 });
  gtag('consent', 'update', consentState(c));
  gtag('js', new Date());
  // anonymize_ip is automatic in GA4; don't send page titles that may contain goals.
  gtag('config', GA_ID, { send_page_view: true, page_title: 'Be:More' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Call once at start-up. */
export function initAnalytics() {
  const existing = getCookieChoice();
  if (existing) load(existing);
  window.addEventListener(COOKIE_CHOICE_EVENT, (e) => {
    const c = (e as CustomEvent<CookieChoice>).detail;
    if (loaded) {
      gtag('consent', 'update', consentState(c));
      // Withdrawing consent: clear GA cookies already set on this site.
      if (!c.analytics) {
        document.cookie.split(';').map((x) => x.split('=')[0].trim()).filter((n) => n.startsWith('_ga'))
          .forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=${location.hostname.replace(/^www\./, '.')}`; document.cookie = `${n}=; Max-Age=0; path=/`; });
      }
    } else {
      load(c);
    }
  });
}

/** Sends a page view for single-page navigation (no-op until analytics is loaded). */
export function trackPageView(path: string) {
  if (!loaded || !GA_ID) return;
  gtag('event', 'page_view', { page_path: path, page_title: 'Be:More' });
}
