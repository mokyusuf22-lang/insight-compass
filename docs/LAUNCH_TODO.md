# Launch to-do list

Your steps before Be:More goes live, in order. Tick them off as you go. Background on each: [COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md).

Status on 8 Nov 2026: the Supabase CLI is logged in and linked to **bemore**. The single-coach change and the primary coach are done. `ANTHROPIC_API_KEY` is set.

## 1. Terminal (about 5 minutes)

- [x] **Apply the security changes and deploy the AI functions.** Done 8 Nov 2026.
  ```bash
  npm run supabase:setup
  ```
  It runs the security migration and deploys `aura-plan`, `generate-coaching` and `delete-account`. Safe to run again.
- [ ] **Make yourself admin.** Sign up in the app with your email first, then:
  ```bash
  npm run supabase:setup -- --admin you@example.com
  ```
- [ ] **When you have a domain**, limit who can call the AI:
  ```bash
  npm run supabase:setup -- --domain yourdomain.com
  ```
  Until then, any website can call the functions. They still need a signed-in user and still apply the daily limits.
- [ ] **Free backup AI keys** (Groq, Mistral, OpenRouter): follow [AI_PROVIDERS.md](AI_PROVIDERS.md), then run `npm run supabase:setup` again.
- [ ] **Check everything shows `true`:** `npm run supabase:check`

## 2. Supabase dashboard (about 10 minutes)

[supabase.com/dashboard/project/gbrgscsloxjvqquknmxm](https://supabase.com/dashboard/project/gbrgscsloxjvqquknmxm)

- [ ] **Authentication → Sign In / Providers:**
  - Turn on **Allow anonymous sign-ins**.
  - Turn off **Confirm email**.
- [ ] **Authentication → Attack Protection:**
  - Turn on **Leaked password protection**.
  - Set **Minimum password length** to 8.
- [ ] **Authentication → Attack Protection → CAPTCHA:**
  - Turn it on with Cloudflare Turnstile.
  - Then tell me, and I'll add the CAPTCHA widget to sign-in. Sign-in breaks until I do, so do these two together.
- [ ] **Authentication → Rate limits:** set anonymous sign-ins to about 30 per hour.
- [ ] **Advisors → Security Advisor:** check for red items.

## 3. Vercel (about 5 minutes)

- [ ] **Import** the GitHub repo and deploy the `aura-revamp-coaching` branch (or merge it to `main` first).
- [ ] **Settings → Environment Variables:** add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PROJECT_ID`, copied from `.env`.
- [ ] **Add `VITE_GA_MEASUREMENT_ID`** once you have a Google Analytics property.
- [ ] **Add your custom domain**, then run the `--domain` step in section 1.
- [ ] **Add the Vercel URL in Supabase:** go to **Authentication → URL Configuration** and add it to the Site URL and Redirect URLs.

## 4. Google Analytics (about 10 minutes)

- [ ] **Create a GA4 property** and copy the `G-XXXXXXX` ID into Vercel (section 3).
- [ ] **Admin → Data collection:** turn off Google Signals.
- [ ] **Admin → Data retention:** set it to 2 months.
- [ ] **Account settings:** turn off data sharing you don't need.

## 5. Paperwork

- [ ] **Fill in the `LEGAL` block** at the top of `src/pages/Legal.tsx`: company name, number, address, privacy email, support email and ICO number. Then tell me and I'll push it.
- [ ] **Have a solicitor review** `/privacy`, `/terms`, `/cookies` and the consent wording.
- [ ] **Register with the ICO** and pay the data protection fee: [ico.org.uk/fee](https://ico.org.uk/for-organisations/data-protection-fee/).
- [ ] **Download a copy of the data processing terms (DPA)** from each provider: Supabase, Anthropic, Vercel and Google.
- [ ] **Set up a privacy inbox**, for example privacy@yourdomain. You must answer data requests within one month.
- [ ] **Write a one-page breach plan:** who decides, and who tells the ICO within 72 hours.

## 6. Decisions I need from you

- [ ] **Health rating.** Keep it required to use Aura, or make it optional? Ask the solicitor.
- [ ] **Guest data.** Delete inactive guest accounts after 90 days? If yes, I'll build the clean-up job.
- [ ] **Coach messages.** When a client deletes their account, delete their messages too (current behaviour), or keep an anonymised copy?
- [ ] **Health and money goals.** Offer them at launch?
- [ ] **"Stay updated" box on the home page.** Remove it, or connect it to a mailing list?

## 7. Before you announce

- [ ] **Sign up as a guest, run through Aura and get a plan.** The AI should answer, not general content.
- [ ] **Ask a question on a task page** and check you get an AI answer.
- [ ] **Account page:** test **Download my data**, then **Delete account** on a test account.
- [ ] **Check the cookie banner:** clicking **Reject all** should load no Google script. Check in DevTools → Network.
- [ ] **Coach check:** message Sam as a client and check the coach account sees it.
