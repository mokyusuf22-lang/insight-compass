# Security, privacy and consent

Security review of Be:More, 7 November 2026. Assumptions: launch in the **UK and EU** (database in Ireland), **minimum age 16**, hosted on **Vercel**, using **Google Analytics and Google Ads**.

This is a technical review, not legal advice. Have a solicitor review the Privacy Policy, Terms and consent wording before public launch.

## 1. What the review found

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | **Critical** | `bootstrap_admin()` could be called by any signed-in user. If no admin existed, anyone could make themselves admin, and a guest account is free to create. | **Fixed** (migration): callable only from the SQL editor |
| 2 | High | Coaches could edit `is_primary` and `max_clients` on their own profile, so any coach could make themselves everyone's coach. Any user could also create a coach profile. | **Fixed** (migration): only admins change those fields; only coaches write profiles |
| 3 | High | No limit on AI calls. Each call costs money and guest accounts are free, so a script could run up the Anthropic bill. | **Fixed**: per user, 30 theme calls, 15 plans and 60 task questions a day, and at most 10 AI calls in any 10 minutes |
| 4 | Medium | AI functions accepted browser calls from any website (`CORS *`). | **Fixed** in code. Takes effect once you set `ALLOWED_ORIGINS` (section 4) |
| 5 | Medium | No security headers (CSP, HSTS, clickjacking protection). | **Fixed**: `vercel.json` |
| 6 | Medium | "Deactivate account" only signed you out and kept all your data, and there was no way to delete it (GDPR right to erasure). | **Fixed**: real "Delete my account" and "Download my data" |
| 7 | Medium | Terms and Privacy links went to `#`. There was no consent record, age check or cookie consent. | **Fixed** (draft pages and consent; section 2) |
| 8 | Low | Unexpected server errors were shown to the browser in full. | **Fixed**: generic message; details stay in the function logs |
| 9 | Low | No size limit on coach messages. | **Fixed**: 5,000 characters |
| 10 | Low | The coach directory was readable without signing in. | **Fixed**: only signed-in users can read it |
| 11 | Info | Every table has row-level security on. `.env` isn't in git, and only public keys are in the frontend. | OK |
| 12 | Info | The home-page "Stay updated" newsletter box doesn't do anything and collects nothing. | **Open**: remove it, or wire it up with a consent line |

## 2. What users are now asked, and where

Every consent is saved to the new `user_consents` table, with the type, yes or no, policy version and time. Rows are never edited. Withdrawing a consent adds a new row with `granted = false`.

| Consent | Where | Required? | Saved as |
|---|---|---|---|
| Cookie choice: Accept all, Reject all, or Manage (Analytics / Advertising) | Banner on first visit; reopen any time with **Cookie settings** in footers and Account | Yes, before Google loads | Browser only (`bm-cookie-choice`) |
| "I'm 16 or over and agree to the Terms and Privacy Policy" | Sign-in page, for **Continue as guest** and **Create account** | Yes | `age_16`, `terms_privacy` |
| Marketing emails (unticked) | Sign-up form, and a switch in Account | Optional | `marketing_email` |
| AI and wellbeing: "Aura can use my answers, including health and wellbeing ratings… sent to Anthropic" | Aura's first screen | Yes, to use Aura | `ai_processing`, `sensitive_data` |
| Coach access: "Sam can see your goal, answers, plan, progress and messages" | Aura Commit step (coach option) and My Coach "Message Sam" | Shown as a notice; saved when they go ahead | `coach_access` |

How Google is handled:
- Analytics and Ads use **Google Consent Mode v2**. The Google script isn't even downloaded until someone accepts.
- Turning analytics off later clears the `_ga` cookies.
- Page paths have user IDs removed before they're sent to Google, and page titles are fixed to "Be:More", so goals never reach Google.
- To switch analytics on, set `VITE_GA_MEASUREMENT_ID`.

## 3. Pages added

- **`/privacy`, `/terms`, `/cookies`:** drafts in `src/pages/Legal.tsx`. Fill in the `LEGAL` block at the top (company name, number, address, emails, ICO number).
- **Account → Privacy & data:** marketing switch, cookie settings and **Download my data** (JSON).
- **Account → Delete account:** you type DELETE to confirm. Coach and admin accounts are refused and must be deleted by an admin.

When the legal wording changes, bump `POLICY_VERSION` in `src/lib/consent.ts`. That asks users about cookies again, and new consents record the new version.

## 4. What you need to do before launch

**Supabase (SQL editor, in order):**
1. Run `supabase/migrations/20261105120000_single_coach.sql` if you haven't yet.
2. Run `supabase/migrations/20261107120000_security_hardening.sql`.
3. If there's no admin yet: `INSERT INTO public.user_roles (user_id, role) VALUES ('<your user id>', 'admin');`

**Supabase dashboard:**
4. **Authentication → Attack Protection:**
   - Turn on **CAPTCHA** (Cloudflare Turnstile or hCaptcha). This matters most now that guest accounts are free; the app needs a small change to send the CAPTCHA token, so ask me once it's on.
   - Turn on **leaked password protection**.
   - Set the minimum password length to **8**.
5. **Authentication → Rate limits:** lower **anonymous sign-ins per hour** (e.g. 30 per IP).

**Edge functions (terminal):**
6. Set the allowed websites, using your real domain:
   `supabase secrets set ALLOWED_ORIGINS="https://<your-domain>,https://www.<your-domain>,https://*.vercel.app,http://localhost:8080"`
7. Deploy: `supabase functions deploy aura-plan generate-coaching delete-account`

**Vercel:**
8. `vercel.json` is picked up automatically. Add `VITE_GA_MEASUREMENT_ID` under Project → Environment Variables.
9. If you later add a service that loads from another domain (a chat widget, Stripe, images from a CDN), add it to the `Content-Security-Policy` in `vercel.json`, or the browser will block it.

**Paperwork:**
10. Fill in the `LEGAL` block in `src/pages/Legal.tsx` and have a solicitor review all three pages.
11. Register with the ICO (UK data protection fee), unless exempt.
12. Sign the data processing terms (DPAs) with Supabase, Anthropic, Vercel and Google. Most are accepted by default in each provider's terms, but download a copy of each for your records.
13. In Google Analytics, turn off Google Signals and data sharing unless you need them, and set data retention to 2 months or 14 months.

## 5. Decisions still open

1. **Health data and freely given consent.** Aura's check-ins include a health/wellbeing rating, and the consent tickbox is currently required to use Aura. Under GDPR, consent for health data must be freely given. Ask your solicitor whether that's acceptable here. If not, I can make the health rating optional (skippable, and not sent to the AI if declined).
2. **Guest data retention.** The Privacy Policy says inactive guest accounts are deleted after **90 days**. A scheduled clean-up job still needs building (Supabase cron). Confirm the number first.
3. **Coach messages after deletion.** Deleting a client account deletes their messages for the coach too. Confirm that's what you want, versus keeping an anonymised record.
4. **Health and money goals at launch.** The AI prompts already add "check with a professional" steps. Decide whether you're comfortable offering these goals, given the disclaimer in the Terms.
5. **Who is the data controller?** This means company details and a contact email for privacy requests, which you must answer within one month.

## 6. Still to build later

- [ ] CAPTCHA token on guest and email sign-up (after step 4).
- [ ] Guest → full account: add an email and password, keeping the same data (`supabase.auth.updateUser`).
- [ ] Scheduled deletion of inactive guest accounts (decision 2).
- [ ] Ask existing users to accept the Terms when `POLICY_VERSION` changes (currently only new sign-ups are asked).
- [ ] Error monitoring (e.g. Sentry) set to strip personal data and AI prompts.
- [ ] A data-breach plan: who decides, and who tells the ICO within 72 hours.
- [ ] The newsletter box on the home page (finding 12).
- [ ] Re-enable Google sign-in after OAuth verification. It must show the same 16+ and Terms tickbox before redirecting.
