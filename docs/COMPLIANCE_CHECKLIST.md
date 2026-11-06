# Security, privacy and consent checklist

This lists what we need to **decide**, what we need to **ask users for**, and what we need to **build**. Be:More collects goals, wellbeing and personality answers, location, and messages with a coach. Some of that can count as sensitive under UK/EU GDPR, so treat this list as the minimum before a public launch. Have a solicitor or DPO review the final wording.

## A. Things we ask the user (consents and tickboxes)

| # | Ask | When | Required? |
|---|---|---|---|
| 1 | **Cookie consent:** "Essential only" or "Accept analytics". No non-essential cookies or trackers before consent. | First visit (banner) | Yes, if we use any analytics or marketing cookies |
| 2 | **Terms and Privacy Policy:** a tickbox, "I agree to the Terms of Service and Privacy Policy", with working links. The links on `/auth` currently go to `#`. | Sign-up and guest start | Yes |
| 3 | **Age:** "I am 16 or over" (or 13+/18+, whichever we decide). | Sign-up and guest start | Yes |
| 4 | **Sensitive data consent:** "Aura uses your answers about wellbeing, health and personality to build your plan." Needs explicit consent if health data is involved. | Before Aura's check-ins | Yes, if health goals are allowed |
| 5 | **AI disclosure:** "Your plan is written by AI (Anthropic's Claude). Your answers are sent to Anthropic to generate it and aren't used to train their models." | Before the first AI call | Recommended (transparency) |
| 6 | **Location:** "We use your country and town to tailor steps. You can leave the town blank." | Aura "About you" step | Recommended |
| 7 | **Coach access:** "Your coach, Sam, can see your goal, answers, plan and progress." | When choosing "With your coach" | Yes |
| 8 | **Messages:** "Messages with your coach are stored so you can both see the history." | First coach message | Recommended |
| 9 | **Marketing emails:** an opt-in (not pre-ticked) for tips and updates. | Sign-up, or later | Only if we send marketing |
| 10 | **Guest accounts:** "Guest progress is saved on this device only. Add an email to keep it." | Guest start, and a reminder later | Recommended |

## B. Things we need to decide (business and legal)

1. **Who is the data controller?** Company name, address and contact email for the Privacy Policy.
2. **Minimum age** (see A3), and whether under-18s need parental consent.
3. **Which goal types are allowed.** Health, mental health and money goals raise the bar (A4, plus safety wording in the AI prompts).
4. **Retention:**
   - How long we keep inactive guest accounts. Suggestion: delete after 90 days without activity.
   - How long we keep closed accounts and coach messages.
5. **Processors list** for the Privacy Policy: Supabase (hosting, database and auth, and in which region), Anthropic (AI), Google (if Google sign-in returns), and any analytics or email provider.
6. **International transfers:** where Supabase and Anthropic process data, and the safeguards (e.g. Standard Contractual Clauses).
7. **Coach terms:** the coach's confidentiality agreement, what they may do with client data, and what happens when someone stops coaching.
8. **Disclaimer wording:** Be:More is not medical, financial or legal advice.
9. **Complaints and contact route**, and the ICO registration (UK) if required.

## C. Things we need to build

**User rights (GDPR)**
- [ ] Cookie banner with saved choice, and no analytics before consent.
- [ ] Terms of Service and Privacy Policy pages. Link them from the footer, `/auth` and Aura.
- [ ] Consent tickboxes from section A, with the consent **saved** (what was agreed, when, and which policy version) in a `user_consents` table.
- [ ] **Download my data:** export the goal, answers, plan and messages from Account.
- [ ] **Delete my account:** removes the auth user and cascades to all tables. Coach messages need a decision.
- [ ] **Upgrade a guest to a full account:** add an email and password via `supabase.auth.updateUser`, keeping the same user ID and data.
- [ ] Clean-up job for old guest accounts, matching the retention decision.

**Security**
- [ ] **Security review of RLS:**
  - Every table has row-level security.
  - Users only see their own rows.
  - Coaches only see their assigned clients.
  - Admins are checked server-side.
- [ ] **Rate limits on AI calls per user:** the edge functions cost money per call, and anyone can now start a guest account. Suggested start: 20 plans per user per day, plus Supabase's anonymous sign-in rate limit and CAPTCHA (Turnstile or hCaptcha) on guest sign-in.
- [ ] Secrets only live in Supabase secrets, never in `.env` files committed to git. Check that `.env` contains only public keys, and rotate any real secret that was ever committed.
- [ ] Password policy: at least 8 characters, and turn on leaked-password protection in Supabase Auth.
- [ ] HTTPS only, and security headers on the host (CSP, HSTS, X-Frame-Options).
- [ ] Error monitoring that doesn't log personal data or AI prompts with user answers.
- [ ] Data-breach plan: who is told, and within 72 hours (ICO).
- [ ] Re-enable Google sign-in once the Google OAuth app is verified. The switch is `GOOGLE_ENABLED` in `src/pages/Auth.tsx`.

## D. Questions to bring to the next meeting

1. What minimum age do we want?
2. Do we allow health and mental-health goals at launch?
3. Will we use analytics (e.g. Google Analytics or Plausible)? This decides whether we need a full cookie banner or just a notice.
4. Will we send marketing emails?
5. How long should guest data live?
6. What company details go in the Privacy Policy?
7. Who reviews the legal wording?
