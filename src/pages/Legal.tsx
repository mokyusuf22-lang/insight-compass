// DRAFT legal pages: Privacy Policy, Terms of Service, Cookie Policy.
// These are a starting point written against UK GDPR / EU GDPR and PECR. They are NOT
// legal advice: have a solicitor review them before launch, then bump POLICY_VERSION
// in src/lib/consent.ts so users are asked to agree to the final wording.
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MIN_AGE, openCookieSettings, POLICY_VERSION } from '@/lib/consent';
import { PRIMARY_COACH } from '@/lib/coachProfile';

// ── Fill these in once ─────────────────────────────────────────────────────────
const LEGAL = {
  company: '[Company legal name] Ltd',
  companyNumber: '[Company number]',
  address: '[Registered address]',
  email: 'privacy@[your-domain]',
  supportEmail: 'support@[your-domain]',
  icoNumber: '[ICO registration number]',
  governingLaw: 'England and Wales',
  /** Proposed: delete guest accounts after this many days without activity. */
  guestRetentionDays: 90,
};
// ───────────────────────────────────────────────────────────────────────────────

const updated = new Date(POLICY_VERSION).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-6 text-center">
        <Link to="/" className="font-sans text-lg font-semibold tracking-wide">Be:More</Link>
      </header>
      <main className="container max-w-3xl px-4 py-10 md:px-8">
        <h1 className="mb-2 font-serif text-3xl md:text-4xl">{title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated {updated} · Version {POLICY_VERSION}</p>
        <div className="legal-prose flex flex-col gap-4 text-[15px] leading-relaxed [&_a]:underline [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-border [&_th]:bg-secondary [&_th]:p-2 [&_th]:text-left">
          {children}
        </div>
        <LegalLinks className="mt-12 border-t border-border pt-6" />
      </main>
    </div>
  );
}

/** Footer links to the legal pages and cookie settings. */
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground ${className}`}>
      <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
      <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
      <Link to="/cookies" className="hover:text-foreground">Cookie Policy</Link>
      <button type="button" onClick={openCookieSettings} className="hover:text-foreground">Cookie settings</button>
    </nav>
  );
}

export function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This policy explains what personal data Be:More collects, why, who we share it with and your rights.
        Be:More is run by {LEGAL.company} (company number {LEGAL.companyNumber}, {LEGAL.address}), the data
        controller. Contact us at <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. ICO registration: {LEGAL.icoNumber}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email and password (stored hashed), or a guest account with no email.</li>
        <li><strong>Your goal and plan:</strong> the goal you choose, your answers in Aura (experience, time available, obstacles), your plan, tasks and progress.</li>
        <li><strong>Check-ins and assessments:</strong> wellbeing (“wheel of life”), values, personality and strengths answers. Some of these can reveal information about your health, which is <em>special category data</em>.</li>
        <li><strong>Location:</strong> the country and, if you give it, the town you enter, used to tailor your plan. We don’t use GPS.</li>
        <li><strong>Messages</strong> between you and your coach.</li>
        <li><strong>Technical data:</strong> sign-in records, browser type, and, only if you accept cookies, analytics data.</li>
      </ul>

      <h2>Why we use it, and our legal basis</h2>
      <table>
        <thead><tr><th>Purpose</th><th>Legal basis</th></tr></thead>
        <tbody>
          <tr><td>Running your account and building your plan</td><td>Contract (providing the service you asked for)</td></tr>
          <tr><td>Using wellbeing or health-related answers</td><td>Your explicit consent, which you can withdraw at any time</td></tr>
          <tr><td>Sharing your plan and progress with your coach</td><td>Contract, with your agreement when you choose coaching</td></tr>
          <tr><td>Security, preventing abuse and limiting AI use</td><td>Legitimate interests (keeping the service safe and affordable)</td></tr>
          <tr><td>Analytics and advertising cookies</td><td>Your consent, via the cookie banner</td></tr>
          <tr><td>Marketing emails</td><td>Your consent (opt-in only)</td></tr>
        </tbody>
      </table>

      <h2>AI</h2>
      <p>
        Your plan, themes and task answers are written by AI (Claude, made by Anthropic). To do this we send your
        goal, Aura answers and town/country to Anthropic. Under Anthropic’s commercial terms this data isn’t used to
        train their models. AI suggestions can be wrong: they aren’t medical, financial or legal advice. No decision
        with legal or similarly significant effects is made about you by automated means.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Your coach</strong> ({PRIMARY_COACH.name}), if you choose coaching: your goal, answers, plan, progress and messages.</li>
        <li><strong>Supabase</strong> (database, sign-in and hosting of our data), in Ireland (EU).</li>
        <li><strong>Anthropic</strong> (AI), in the United States.</li>
        <li><strong>Vercel</strong> (website hosting), global.</li>
        <li><strong>Google</strong> (Analytics and Ads), only if you accept those cookies.</li>
      </ul>
      <p>
        Where data goes outside the UK/EEA we rely on the UK International Data Transfer Addendum / EU Standard
        Contractual Clauses, or an adequacy decision. We never sell your data.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Full accounts: until you delete your account.</li>
        <li>Guest accounts: deleted after {LEGAL.guestRetentionDays} days without activity.</li>
        <li>Records of what you agreed to: for as long as we hold your data, plus up to 6 years to defend legal claims.</li>
        <li>AI usage counters: 2 days.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can access, correct, download or delete your data, object to or restrict how we use it, and withdraw
        consent at any time. You can download your data and delete your account yourself from
        {' '}<Link to="/account">Account settings</Link>. For anything else, email{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>; we reply within one month. You can complain to the
        Information Commissioner’s Office (ico.org.uk) or your local data protection authority.
      </p>

      <h2>Age</h2>
      <p>Be:More is for people aged {MIN_AGE} and over. We don’t knowingly collect data from anyone younger.</p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit and at rest. Access is limited per user by database rules, and only your
        assigned coach can see your coaching data. If a breach is likely to put you at risk, we’ll tell you
        and the ICO within 72 hours.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy in a way that matters, we’ll ask you to agree again when you next sign in.</p>
    </LegalLayout>
  );
}

export function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        These terms are an agreement between you and {LEGAL.company} (“we”), which runs Be:More. By creating an
        account or continuing as a guest you agree to them and confirm you are {MIN_AGE} or over.
      </p>

      <h2>The service</h2>
      <p>
        Be:More helps you set a goal and follow a step-by-step plan, written with AI and optionally supported by a
        human coach. It is a self-improvement tool. <strong>It is not medical, mental-health, financial, legal or
        other professional advice.</strong> Check with a qualified professional before acting on anything that
        affects your health, money or legal position. If you are in crisis, contact your local emergency services
        or, in the UK, call 111 or Samaritans on 116 123.
      </p>

      <h2>AI content</h2>
      <p>
        Plans and answers are generated by AI and can be inaccurate, incomplete or unsuitable for you. Use your own
        judgement. We limit the number of AI requests per person per day to keep the service fair.
      </p>

      <h2>Coaching</h2>
      <p>
        Coaching is provided by {PRIMARY_COACH.name} on behalf of Be:More. Coaches aim to reply within one
        working day but this isn’t guaranteed. Coaches are not therapists or doctors.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Keep your password safe. You’re responsible for activity on your account.</li>
        <li>Guest accounts are tied to the browser you used. If you clear it or change device, your progress may be lost.</li>
        <li>You may delete your account at any time from Account settings.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don’t use Be:More for anything unlawful, harmful or to harass others, including your coach.</li>
        <li>Don’t try to break, overload, scrape or reverse-engineer the service, or get around usage limits.</li>
        <li>Don’t create accounts in bulk or automate use of the AI.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2>Our content</h2>
      <p>
        Be:More, its design and content belong to us. Your goals, answers and messages belong to you; you give us
        permission to use them only to run the service for you.
      </p>

      <h2>Liability</h2>
      <p>
        We provide Be:More “as is” and don’t promise it will meet every need or be available without interruption.
        Nothing in these terms limits liability that cannot be limited by law, including for death or personal
        injury caused by negligence, or your statutory rights as a consumer.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms; if the change matters we’ll ask you to agree again. These terms are governed by
        the law of {LEGAL.governingLaw}. Questions: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
      </p>
    </LegalLayout>
  );
}

export function Cookies() {
  return (
    <LegalLayout title="Cookie Policy">
      <p>
        Cookies and similar storage are small files saved by your browser. We only use non-essential ones if you
        say yes. You can change your mind at any time:{' '}
        <button type="button" onClick={openCookieSettings} className="underline">open cookie settings</button>.
      </p>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Lasts</th></tr></thead>
        <tbody>
          <tr><td>sb-*-auth-token (local storage)</td><td>Essential</td><td>Keeps you signed in (Supabase)</td><td>Until you sign out</td></tr>
          <tr><td>bm-cookie-choice, bm-pending-consents, Aura drafts (local storage)</td><td>Essential</td><td>Remembers your cookie choice, consents and unsaved Aura progress</td><td>Until cleared</td></tr>
          <tr><td>_ga, _ga_*</td><td>Analytics (opt-in)</td><td>Google Analytics: counts visits and how pages are used</td><td>Up to 2 years</td></tr>
          <tr><td>_gcl_*, Google Ads cookies</td><td>Advertising (opt-in)</td><td>Google Ads: measures ad performance and may personalise ads</td><td>Up to 90 days</td></tr>
        </tbody>
      </table>
      <p>
        We don’t send your goals, answers or messages to Google. See our <Link to="/privacy">Privacy Policy</Link> for more.
      </p>
    </LegalLayout>
  );
}
