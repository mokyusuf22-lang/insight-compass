// Consent records (saved to user_consents) and the cookie choice (saved in the browser).
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * The Supabase client without the generated table types, for tables added after
 * types.ts was last generated (user_consents) or looked up by name (data export).
 */
export const untypedDb = supabase as unknown as SupabaseClient;

import { POLICY_VERSION } from './policyVersion';

export { POLICY_VERSION, MIN_AGE } from './policyVersion';

export type ConsentType =
  | 'terms_privacy'
  | 'age_16'
  | 'ai_processing'
  | 'sensitive_data'
  | 'coach_access'
  | 'marketing_email';

export interface ConsentEntry {
  type: ConsentType;
  granted: boolean;
}

const PENDING_KEY = 'bm-pending-consents';

/** Saves consents for the signed-in user. Returns false if nobody is signed in or the save failed. */
export async function recordConsents(entries: ConsentEntry[]): Promise<boolean> {
  if (entries.length === 0) return true;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await untypedDb.from('user_consents').insert(
    entries.map((e) => ({
      user_id: user.id,
      consent_type: e.type,
      granted: e.granted,
      policy_version: POLICY_VERSION,
      user_agent: navigator.userAgent.slice(0, 300),
    })),
  );
  if (error) console.error('Saving consent failed:', error.message);
  return !error;
}

/**
 * Consents given on the sign-in page, before an account exists. They're kept in the
 * browser and saved by AuthContext as soon as the user is signed in.
 */
export function queuePendingConsents(entries: ConsentEntry[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(entries));
  } catch { /* storage blocked: the consent is still enforced by the form */ }
}

export async function flushPendingConsents() {
  let entries: ConsentEntry[] = [];
  try {
    entries = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch { return; }
  if (!Array.isArray(entries) || entries.length === 0) return;
  if (await recordConsents(entries)) {
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  }
}

// ── Cookies ─────────────────────────────────────────────────────────────────

export interface CookieChoice {
  analytics: boolean;
  ads: boolean;
  version: string;
  decidedAt: string;
}

const COOKIE_KEY = 'bm-cookie-choice';
export const COOKIE_CHOICE_EVENT = 'bm-cookie-choice';
export const OPEN_COOKIE_SETTINGS_EVENT = 'bm-open-cookie-settings';

export function getCookieChoice(): CookieChoice | null {
  try {
    const c = JSON.parse(localStorage.getItem(COOKIE_KEY) ?? 'null') as CookieChoice | null;
    // A new policy version asks again.
    return c && c.version === POLICY_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function setCookieChoice(analytics: boolean, ads: boolean) {
  const choice: CookieChoice = { analytics, ads, version: POLICY_VERSION, decidedAt: new Date().toISOString() };
  try { localStorage.setItem(COOKIE_KEY, JSON.stringify(choice)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent<CookieChoice>(COOKIE_CHOICE_EVENT, { detail: choice }));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
