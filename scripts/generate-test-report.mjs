/**
 * generate-test-report.mjs
 * Generates a comprehensive Excel QA test report for the Aura onboarding flow.
 * Based on code analysis of all Aura pages, hooks, edge functions, and routing.
 *
 * Run: node scripts/generate-test-report.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '..', 'aura-test-cases.xlsx');

// ─── Helpers ────────────────────────────────────────────────────────────────

function headerStyle(fg = '1F3864') {
  return {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: fg }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { rgb: 'AAAAAA' } },
      bottom: { style: 'thin', color: { rgb: 'AAAAAA' } },
      left:   { style: 'thin', color: { rgb: 'AAAAAA' } },
      right:  { style: 'thin', color: { rgb: 'AAAAAA' } },
    },
  };
}

function cellStyle(opts = {}) {
  return {
    alignment: { wrapText: true, vertical: 'top' },
    font: { sz: 10, ...(opts.font || {}) },
    fill: opts.fill ? { fgColor: { rgb: opts.fill }, patternType: 'solid' } : undefined,
    border: {
      top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
      right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  };
}

const STATUS_FILL = {
  Pass:       'C6EFCE',
  Fail:       'FFC7CE',
  Blocked:    'FFEB9C',
  'Not Tested': 'EDEDED',
};

const PRIORITY_FILL = {
  P0: 'FF0000',
  P1: 'FF6600',
  P2: 'FFCC00',
  P3: 'CCCCCC',
};

const SEV_FILL = {
  Critical: 'FF0000',
  High:     'FF6600',
  Medium:   'FFCC00',
  Low:      'CCCCCC',
};

// ─── Sheet 1: Test Cases ─────────────────────────────────────────────────────

const TC_HEADERS = [
  'TC_ID', 'Page / Step', 'Test Name', 'Preconditions',
  'Steps', 'Expected Result', 'Actual Result', 'Status', 'Priority', 'Notes',
];

const testCases = [
  // ── HAPPY PATH ──────────────────────────────────────────────────────────────
  {
    id: 'TC-001',
    page: 'Step 1 — /aura/welcome',
    name: 'Happy path: new user completes welcome form and advances to challenge',
    pre: 'Authenticated user with no existing aura_sessions record.',
    steps: '1. Navigate to /aura/welcome.\n2. Wait for typing animation to finish.\n3. Enter name ≥2 chars and valid email.\n4. Click "Continue".',
    expected: 'DB row created in aura_sessions with current_step=2. localStorage aura_flow_active set to user.id. User redirected to /aura/challenge.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Core happy path. Verify DB insert AND localStorage in DevTools.',
  },
  {
    id: 'TC-002',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Happy path: user types 30+ words and submits challenge for AI analysis',
    pre: 'aura_sessions row exists with current_step=2. User is authenticated.',
    steps: '1. Navigate to /aura/challenge.\n2. Wait for typing animation.\n3. Enter text ≥30 words in textarea.\n4. Click "Share with Aura".',
    expected: 'analyze-challenge edge fn called. Themes and summary displayed. DB updated with identified_themes, aura_summary, current_step=3.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Test with real AI call and with mocked 500 response.',
  },
  {
    id: 'TC-003',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Happy path: user confirms AI summary and advances to assessment-intro',
    pre: 'AI analysis complete; showResults=true.',
    steps: '1. Click "Yes, that\'s right".',
    expected: 'DB updated: user_confirmed=true, current_step=3. Navigate to /aura/assessment-intro.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Note: current_step stays 3 (not incremented further at confirm).',
  },
  {
    id: 'TC-004',
    page: 'Step 4 — /aura/assessment-intro',
    name: 'Happy path: user clicks "Let\'s begin" and advances to assessments',
    pre: 'aura_sessions row with current_step=3.',
    steps: '1. Navigate to /aura/assessment-intro.\n2. Wait for typing animation.\n3. Click "Let\'s begin".',
    expected: 'DB updated: current_step=5. Navigate to /aura/assessments.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Step jumps directly from 3→5, skipping step 4 enum value. Assessment-intro page shows currentStep=4 in progress bar.',
  },
  {
    id: 'TC-005',
    page: 'Step 5 — /aura/assessments',
    name: 'Happy path: all relevant assessments complete — continue to insights',
    pre: 'All completionStatus flags true for relevant assessments.',
    steps: '1. Navigate to /aura/assessments.\n2. Confirm all Done badges shown.\n3. Click "View My Insights".',
    expected: 'DB updated: current_step=6. Navigate to /aura/insights.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Verify allRelevantComplete logic in code.',
  },
  {
    id: 'TC-006',
    page: 'Step 6 — /aura/insights',
    name: 'Happy path: insights generated and recommendation displayed',
    pre: 'current_step=6; at least one assessment result exists in DB.',
    steps: '1. Navigate to /aura/insights.\n2. Wait for loader to disappear.\n3. Observe insight cards and recommendation.',
    expected: 'Recommendation section visible with "Continue" button. All completed assessment sections rendered.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Test AI fallback: if edge fn throws, generic recommendation text should display.',
  },
  {
    id: 'TC-007',
    page: 'Step 6.5 — /aura/feedback',
    name: 'Happy path: user rates all 3 questions and submits',
    pre: 'current_step=7 set by insights page.',
    steps: '1. Navigate to /aura/feedback.\n2. Rate all 3 questions (1-5 stars).\n3. Optionally enter free text.\n4. Click "Submit Feedback".',
    expected: 'feedback_ratings and feedback_text saved to aura_sessions. Toast success shown. Navigate to /aura/future.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: '',
  },
  {
    id: 'TC-008',
    page: 'Step 7 — /aura/future',
    name: 'Happy path: user has no coach — "Go to Dashboard" navigates to /welcome',
    pre: 'No active record in coach_assignments for user.',
    steps: '1. Navigate to /aura/future.\n2. Wait for content to show.\n3. Click "Go to Dashboard".',
    expected: 'Navigate to /welcome. Only one button visible (no "Message My Coach" button).',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: '',
  },
  {
    id: 'TC-009',
    page: 'Step 7 — /aura/future',
    name: 'Happy path: user has assigned coach — both buttons shown',
    pre: 'Active record exists in coach_assignments for user.',
    steps: '1. Navigate to /aura/future.\n2. Wait for content.',
    expected: '"Message My Coach" button visible. "Go to Dashboard" also present.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: '',
  },

  // ── VALIDATION ──────────────────────────────────────────────────────────────
  {
    id: 'TC-010',
    page: 'Step 1 — /aura/welcome',
    name: 'Validation: empty name field — Continue button disabled',
    pre: 'User on /aura/welcome with typing animation complete.',
    steps: '1. Leave name empty, enter valid email.\n2. Attempt to click "Continue".',
    expected: 'Button disabled (isValid=false). No DB operation triggered.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'isValid = name.trim().length >= 2 && email.includes("@")',
  },
  {
    id: 'TC-011',
    page: 'Step 1 — /aura/welcome',
    name: 'Validation: single-character name — Continue button disabled',
    pre: 'User on /aura/welcome.',
    steps: '1. Enter "A" in name field, valid email.\n2. Attempt click "Continue".',
    expected: 'Button remains disabled. No submission.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'Min length is 2.',
  },
  {
    id: 'TC-012',
    page: 'Step 1 — /aura/welcome',
    name: 'Validation: invalid email (no @ symbol) — Continue disabled',
    pre: 'User on /aura/welcome.',
    steps: '1. Enter valid name, enter "notanemail" in email field.\n2. Attempt click "Continue".',
    expected: 'Button disabled. No submission.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'Validation only checks for "@" — does not validate full email format. e.g., "@" alone would pass.',
  },
  {
    id: 'TC-013',
    page: 'Step 1 — /aura/welcome',
    name: 'Validation: "@" alone passes isValid check (weak email validation)',
    pre: 'User on /aura/welcome.',
    steps: '1. Enter valid name, enter "@" in email field.\n2. Observe button state.',
    expected: 'SHOULD be disabled. ACTUAL: button likely enabled — "@" includes "@" returns true.',
    actual: 'Button enabled — weak validation flaw.',
    status: 'Fail',
    priority: 'P1',
    notes: 'Bug: AuraWelcome.tsx line 147: email.trim().includes("@") — passes "@", "@x", "x@" etc. Should use regex or HTML email type validation.',
  },
  {
    id: 'TC-014',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Validation: fewer than 30 words — Analyse button disabled',
    pre: 'User on /aura/challenge with input shown.',
    steps: '1. Enter 29 words in textarea.\n2. Observe button and counter.',
    expected: 'Word counter shows red "29". "Share with Aura" button disabled.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'countWords uses .split(/\\s+/).filter(Boolean). Multiple spaces collapsed correctly.',
  },
  {
    id: 'TC-015',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Validation: exactly 30 words enables Analyse button',
    pre: 'User on /aura/challenge.',
    steps: '1. Enter exactly 30 words.\n2. Observe button.',
    expected: 'Word count turns green. Button enabled.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: '',
  },
  {
    id: 'TC-016',
    page: 'Step 6.5 — /aura/feedback',
    name: 'Validation: not all 3 questions rated — Submit button disabled',
    pre: 'User on /aura/feedback with form visible.',
    steps: '1. Rate only 2 of 3 questions.\n2. Attempt to click "Submit Feedback".',
    expected: 'Button remains disabled. allRated=false.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: '',
  },
  {
    id: 'TC-017',
    page: 'Step 6.5 — /aura/feedback',
    name: 'Validation: submit with no free text (optional field) succeeds',
    pre: 'All 3 ratings given, free text empty.',
    steps: '1. Rate all questions.\n2. Leave free text empty.\n3. Click "Submit Feedback".',
    expected: 'Submission succeeds. feedback_text saved as null in DB.',
    actual: '',
    status: 'Not Tested',
    priority: 'P2',
    notes: '',
  },

  // ── NAVIGATION & STEP SKIPPING ───────────────────────────────────────────────
  {
    id: 'TC-018',
    page: 'All Aura routes',
    name: 'Auth guard: unauthenticated user hitting /aura/welcome redirects to /auth',
    pre: 'User not logged in.',
    steps: '1. Open /aura/welcome in browser while logged out.',
    expected: 'Redirect to /auth.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'Guard in AuraWelcome.tsx useEffect lines 52-56. All Aura pages have same guard.',
  },
  {
    id: 'TC-019',
    page: 'All Aura routes',
    name: 'Auth guard: unauthenticated user hitting /aura/assessments redirects to /auth',
    pre: 'User not logged in.',
    steps: '1. Open /aura/assessments directly.',
    expected: 'Redirect to /auth.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: '',
  },
  {
    id: 'TC-020',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Step skip: direct URL access to /aura/challenge with no session — redirect to welcome',
    pre: 'Authenticated user with no aura_sessions record.',
    steps: '1. Navigate directly to /aura/challenge.',
    expected: 'loadSession finds no data, navigates to /aura/welcome.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraChallenge.tsx line 112: navigate("/aura/welcome") when no session found.',
  },
  {
    id: 'TC-021',
    page: 'Step 5 — /aura/assessments',
    name: 'Step skip: direct URL access to /aura/assessments with no session — redirect to welcome',
    pre: 'Authenticated user with no aura_sessions record.',
    steps: '1. Navigate directly to /aura/assessments.',
    expected: 'Redirect to /aura/welcome.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraAssessments.tsx line 119.',
  },
  {
    id: 'TC-022',
    page: 'Step 1 — /aura/welcome',
    name: 'Resume: user with current_step=6 visiting /aura/welcome redirects to /aura/insights',
    pre: 'aura_sessions row with current_step=6.',
    steps: '1. Navigate to /aura/welcome.',
    expected: 'Redirect to /aura/insights.',
    actual: '',
    status: 'Fail',
    priority: 'P1',
    notes: 'Bug: Two separate useEffects both query DB and may race. First useEffect (lines 52-77) redirects on step>=2. Second useEffect "restore" (lines 87-145) also redirects. Both run concurrently — navigate() called twice. Could cause flicker or double navigation.',
  },
  {
    id: 'TC-023',
    page: 'Step 1 — /aura/welcome',
    name: 'Resume: user with current_step=7 visiting /aura/welcome redirects to /welcome',
    pre: 'aura_sessions row with current_step=7.',
    steps: '1. Navigate to /aura/welcome.',
    expected: 'Redirect to /welcome (not /aura/future, not /aura/insights).',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'Second useEffect handles step>=7 → /welcome. First useEffect handles step>=2 → /aura/challenge (which conflicts — see TC-022 race).',
  },
  {
    id: 'TC-024',
    page: 'Step 4 — /aura/assessment-intro',
    name: 'Step skip: accessing /aura/assessment-intro with current_step>=5 redirects to assessments',
    pre: 'current_step=5.',
    steps: '1. Navigate to /aura/assessment-intro.',
    expected: 'Redirect to /aura/assessments.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraAssessmentIntro.tsx line 67.',
  },
  {
    id: 'TC-025',
    page: 'Step 6 — /aura/insights',
    name: 'No session found — missing redirect guard on /aura/insights',
    pre: 'Authenticated user with no aura_sessions record navigates to /aura/insights.',
    steps: '1. Navigate to /aura/insights directly.',
    expected: 'Should redirect to /aura/welcome.',
    actual: 'No redirect triggered — page renders with empty content, shows "No completed assessments found."',
    status: 'Fail',
    priority: 'P1',
    notes: 'Bug: AuraInsights.tsx has no check for "no session found" — it simply renders empty insights. Other pages redirect to /aura/welcome when no session exists, but AuraInsights does not. AuraInsights.tsx lines 84-87 only set state, no else-branch navigates away.',
  },
  {
    id: 'TC-026',
    page: 'Step 6.5 — /aura/feedback',
    name: 'No session guard: /aura/feedback has no session-existence check',
    pre: 'Authenticated user with no aura_sessions record.',
    steps: '1. Navigate to /aura/feedback.',
    expected: 'Should redirect to /aura/welcome.',
    actual: 'Page renders normally. On submit, session lookup returns null, no update made, navigates to /aura/future anyway.',
    status: 'Fail',
    priority: 'P1',
    notes: 'Bug: AuraFeedback.tsx has no DB session load on mount and no redirect-if-no-session guard. Only auth check present.',
  },
  {
    id: 'TC-027',
    page: 'Step 7 — /aura/future',
    name: 'No session guard: /aura/future has no session-existence check',
    pre: 'Authenticated user with no aura_sessions record.',
    steps: '1. Navigate to /aura/future.',
    expected: 'Should redirect to /aura/welcome.',
    actual: 'Page renders normally with "Coming Soon" features. No redirect.',
    status: 'Fail',
    priority: 'P2',
    notes: 'Bug: AuraFuture.tsx only checks coach assignment — no aura_sessions guard at all.',
  },

  // ── SESSION PERSISTENCE ───────────────────────────────────────────────────────
  {
    id: 'TC-028',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Page refresh mid-challenge: typed text NOT preserved (no local draft)',
    pre: 'User has typed 50 words but has not clicked "Share with Aura".',
    steps: '1. Type 50 words.\n2. Refresh page (F5).',
    expected: 'Ideally text should be restored from a draft. Actual: textarea resets to empty string.',
    actual: 'Text lost on refresh — no local draft saved.',
    status: 'Fail',
    priority: 'P2',
    notes: 'AuraChallenge.tsx only restores challenge_text from DB if step>=3 AND identified_themes exist (line 106). If user refreshed before hitting Analyse, the typed-but-unsaved text is lost. UX gap — no localStorage draft.',
  },
  {
    id: 'TC-029',
    page: 'Step 2/3 — /aura/challenge',
    name: 'Page refresh after AI analysis: results restored without re-calling AI',
    pre: 'current_step=3, identified_themes and aura_summary stored in DB.',
    steps: '1. Complete AI analysis.\n2. Refresh page.',
    expected: 'Results restored from DB — showResults=true, no new AI call. Both confirm buttons visible.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraChallenge.tsx lines 106-110 handle this case correctly in code.',
  },
  {
    id: 'TC-030',
    page: 'Step 5 — /aura/assessments',
    name: 'Return from individual assessment: completion status updates correctly',
    pre: 'User on /aura/assessments, navigates to /assessment/disc, completes it, returns.',
    steps: '1. Click "Start" on DISC assessment.\n2. Complete DISC assessment.\n3. Return to /aura/assessments.',
    expected: 'DISC card shows "Done" badge. Next assessment unlocked. Completion count incremented.',
    actual: '',
    status: 'Not Tested',
    priority: 'P0',
    notes: 'useAuraReturn hook + setAuraReturnFlag mechanism used. Assessment pages must call navigate("/aura/assessments") when aura_flow_active === user.id.',
  },
  {
    id: 'TC-031',
    page: 'Step 5 — /aura/assessments',
    name: 'LocalStorage aura_flow_active set correctly on entering assessments page',
    pre: 'User at /aura/assessments.',
    steps: '1. Open browser DevTools.\n2. Check localStorage for "aura_flow_active".',
    expected: 'localStorage["aura_flow_active"] equals user.id.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'setAuraReturnFlag is called in AuraWelcome.tsx, AuraAssessmentIntro.tsx handleContinue is called via handleContinue which sets step=5. But AuraAssessments.tsx itself does NOT call setAuraReturnFlag — it relies on it being set earlier.',
  },
  {
    id: 'TC-032',
    page: 'All Aura flow',
    name: 'LocalStorage aura_flow_active cleared after completing /aura/future',
    pre: 'User completes full flow.',
    steps: '1. Complete all 7 steps and click "Go to Dashboard".',
    expected: 'localStorage["aura_flow_active"] removed.',
    actual: 'Flag is NEVER explicitly cleared in AuraFuture.tsx.',
    status: 'Fail',
    priority: 'P2',
    notes: 'Bug: AuraFuture.tsx comment says "Do NOT clear the aura flag here — it must survive until /welcome". clearAuraReturnFlag() is exported from useAuraReturn.ts but never called from AuraFuture. Stale flag persists indefinitely in localStorage for completed users.',
  },

  // ── ASSESSMENT LOCKING ────────────────────────────────────────────────────────
  {
    id: 'TC-033',
    page: 'Step 5 — /aura/assessments',
    name: 'Assessment locking: second assessment locked until first complete',
    pre: 'disc_completed=false, all others false.',
    steps: '1. Navigate to /aura/assessments.\n2. Observe assessment list.',
    expected: 'DISC shows "Start" button. All subsequent assessments show "Locked" badge.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'Lock logic: previousComplete = i===0 || completionStatus[relevantAssessments[i-1].completionFlag]. DISC is always relevant=true. Correct sequential unlocking behavior expected.',
  },
  {
    id: 'TC-034',
    page: 'Step 5 — /aura/assessments',
    name: 'Assessment relevance: themes with no keywords match — all 5 shown',
    pre: 'identified_themes is empty array or null.',
    steps: '1. Navigate to /aura/assessments with empty themes.',
    expected: 'All 5 assessments shown (isRelevant returns true when themes.length===0).',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraAssessments.tsx line 136: themes.length===0 makes isRelevant always return true.',
  },
  {
    id: 'TC-035',
    page: 'Step 5 — /aura/assessments',
    name: 'Assessment relevance: career theme — values and strengths shown as relevant',
    pre: 'identified_themes contains area="Career".',
    steps: '1. Complete challenge with career-focused text.\n2. Navigate to /aura/assessments.',
    expected: 'Values Clarification (career keyword) and Strengths (career keyword) shown as relevant.',
    actual: '',
    status: 'Not Tested',
    priority: 'P2',
    notes: '',
  },

  // ── AI FUNCTION ERROR HANDLING ────────────────────────────────────────────────
  {
    id: 'TC-036',
    page: 'Step 2/3 — /aura/challenge',
    name: 'AI error: analyze-challenge returns 429 — correct toast shown',
    pre: 'Mock analyze-challenge to return HTTP 429.',
    steps: '1. Enter 30+ words.\n2. Click "Share with Aura".\n3. Observe response.',
    expected: 'Toast: "Rate limit reached. Please wait a moment and try again." Analysing state cleared.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraChallenge.tsx lines 152-153. Error check uses err.message.includes("429") — this works if supabase.functions.invoke wraps HTTP error in message.',
  },
  {
    id: 'TC-037',
    page: 'Step 2/3 — /aura/challenge',
    name: 'AI error: analyze-challenge returns 402 — correct toast shown',
    pre: 'Mock analyze-challenge to return HTTP 402.',
    steps: '1. Enter 30+ words.\n2. Click "Share with Aura".',
    expected: 'Toast: "AI service temporarily unavailable. Please try again later."',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: '',
  },
  {
    id: 'TC-038',
    page: 'Step 2/3 — /aura/challenge',
    name: 'AI error: analyze-challenge returns 500 — generic toast shown, no crash',
    pre: 'Mock analyze-challenge to return HTTP 500.',
    steps: '1. Enter 30+ words.\n2. Click "Share with Aura".',
    expected: 'Toast: "Failed to analyse your input. Please try again." isAnalysing reset to false.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'analyze-challenge edge fn has no fallback themes returned on error — UI shows nothing.',
  },
  {
    id: 'TC-039',
    page: 'Step 6 — /aura/insights',
    name: 'AI error: generate-coaching-recommendation fails — fallback text displayed',
    pre: 'Mock generate-coaching-recommendation to throw.',
    steps: '1. Navigate to /aura/insights with assessments complete.\n2. Wait for loader.',
    expected: 'Fallback generic recommendation text shown. isGenerating set to false. No crash.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuraInsights.tsx lines 165-167: catch block sets fallback recommendation — correct behavior.',
  },
  {
    id: 'TC-040',
    page: 'Edge Function',
    name: 'analyze-challenge: input <20 chars returns 400 (server-side guard)',
    pre: 'Direct call to analyze-challenge with challenge_text="Hello".',
    steps: '1. POST to analyze-challenge with short text.',
    expected: 'HTTP 400 with error message.',
    actual: '',
    status: 'Not Tested',
    priority: 'P2',
    notes: 'Server validates >=20 chars; client validates >=30 words. Mismatch allows 20-29 char inputs that pass server but fail client word count (impossible in normal flow, but API-level gap).',
  },
  {
    id: 'TC-041',
    page: 'Edge Function',
    name: 'analyze-challenge: missing LOVABLE_API_KEY env var — returns 500',
    pre: 'Env var not set in Supabase function environment.',
    steps: '1. Call analyze-challenge.',
    expected: 'HTTP 500 returned. Client shows generic error toast.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'Edge fn line 47: throws Error("LOVABLE_API_KEY is not configured"). No graceful degradation — AI call fails hard.',
  },
  {
    id: 'TC-042',
    page: 'Edge Function',
    name: 'generate-coaching-recommendation: no auth header check',
    pre: 'Unauthenticated external caller.',
    steps: '1. POST to generate-coaching-recommendation without Authorization header.',
    expected: 'Should return 401 unauthorized.',
    actual: 'No auth check present in function — any caller can invoke it.',
    status: 'Fail',
    priority: 'P1',
    notes: 'Bug: generate-coaching-recommendation/index.ts has no JWT verification or auth header check. analyze-challenge also lacks auth. Both edge functions are publicly callable.',
  },

  // ── FEEDBACK ─────────────────────────────────────────────────────────────────
  {
    id: 'TC-043',
    page: 'Step 6.5 — /aura/feedback',
    name: 'Feedback: star rating interactive — clicking star 3 fills stars 1-3',
    pre: 'User on feedback page with form visible.',
    steps: '1. Click star 3 on first question.',
    expected: 'Stars 1, 2, 3 filled with accent color. Stars 4, 5 unfilled.',
    actual: '',
    status: 'Not Tested',
    priority: 'P2',
    notes: 'AuraFeedback.tsx ratings[q.id] >= star comparison. Correct behavior expected.',
  },
  {
    id: 'TC-044',
    page: 'Step 6.5 — /aura/feedback',
    name: 'Feedback: progress bar shows step 6 (not step 7) on feedback page',
    pre: 'User on /aura/feedback.',
    steps: '1. Observe AuraProgressBar.',
    expected: 'Step 6 highlighted in progress bar.',
    actual: 'currentStep=6 — feedback and insights share step 6.',
    status: 'Fail',
    priority: 'P2',
    notes: 'Design gap: AuraFeedback.tsx line 104 passes currentStep={6} but the page is described as step 6.5. The progress bar component has 7 steps total; feedback has no dedicated step. User sees step 6 highlighted on both insights and feedback pages — confusing.',
  },

  // ── MOBILE / RESPONSIVE ───────────────────────────────────────────────────────
  {
    id: 'TC-045',
    page: 'All Aura pages',
    name: 'Mobile: form fields and buttons usable on 375px viewport',
    pre: 'Browser DevTools mobile emulation at 375px wide.',
    steps: '1. Open each Aura page at 375px viewport.\n2. Verify form inputs, buttons, and typing animation visible.',
    expected: 'All content scrollable, no horizontal overflow. Buttons full-width readable.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'px-4 container padding in use. max-w-xl and max-w-2xl should stack properly. AuraProgressBar has 7 step dots that may overflow on 375px.',
  },
  {
    id: 'TC-046',
    page: 'Step 1 — /aura/welcome',
    name: 'Mobile: AuraProgressBar 7 dots may overflow on very small screens',
    pre: 'Viewport width < 350px.',
    steps: '1. Open /aura/welcome at 320px width.\n2. Observe progress bar.',
    expected: 'All 7 step dots and connectors visible without overflow.',
    actual: 'Likely overflow/truncation — 7 dots with flex-1 connector lines in limited width.',
    status: 'Not Tested',
    priority: 'P2',
    notes: 'AuraProgressBar.tsx: each step gets flex-1, last:flex-none. On narrow screens 7 dots will be very compressed.',
  },

  // ── AUTH EDGE CASES ───────────────────────────────────────────────────────────
  {
    id: 'TC-047',
    page: 'All Aura routes',
    name: 'Auth loading: blank screen during auth loading state',
    pre: 'Auth context loading=true (initial page load).',
    steps: '1. Load any Aura page while auth is still resolving.',
    expected: 'Page shows loading indicator or skeleton.',
    actual: 'All Aura pages return null when loading=true — blank screen shown.',
    status: 'Fail',
    priority: 'P2',
    notes: 'All Aura page components: "if (loading) return null" — shows blank white screen during auth resolution. No spinner or skeleton shown. Degrades perceived performance.',
  },
  {
    id: 'TC-048',
    page: 'Step 1 — /aura/welcome',
    name: 'Auth: Google OAuth redirect lands on /aura/welcome correctly',
    pre: 'AuthContext.tsx: signInWithGoogle redirectTo = /aura/welcome.',
    steps: '1. Click Google sign-in from auth page.\n2. Complete Google auth.\n3. Observe landing page.',
    expected: 'Redirect to /aura/welcome. Session established. User field pre-filled with Google email.',
    actual: '',
    status: 'Not Tested',
    priority: 'P1',
    notes: 'AuthContext.tsx line 244. Email pre-fill logic in AuraWelcome.tsx line 92.',
  },
  {
    id: 'TC-049',
    page: 'Step 5 — /aura/assessments',
    name: 'DB error: profiles table query fails — completionStatus remains all false',
    pre: 'Mock profiles query to return error.',
    steps: '1. Navigate to /aura/assessments.\n2. Observe assessment states.',
    expected: 'All assessments shown as incomplete. No crash. DISC unlocked for start.',
    actual: '',
    status: 'Not Tested',
    priority: 'P2',
    notes: 'AuraAssessments.tsx: profileRes.data check has no error handling (lines 122-130). Error silently dropped — all completionStatus flags remain false.',
  },
  {
    id: 'TC-050',
    page: 'Step 3 — /aura/challenge (confirm)',
    name: 'handleConfirmAndContinue: no auth check before DB update',
    pre: 'sessionId set, user might have expired session.',
    steps: '1. Complete AI analysis.\n2. With expired/invalid session, click "Yes, that\'s right".',
    expected: 'Error handled gracefully.',
    actual: 'No try/catch around DB update in handleConfirmAndContinue (AuraChallenge.tsx line 164-172). Unhandled promise rejection possible.',
    status: 'Fail',
    priority: 'P1',
    notes: 'Bug: AuraChallenge.tsx handleConfirmAndContinue (lines 164-172) has no try/catch. DB failure causes silent navigation without saving state.',
  },
];

// ─── Sheet 2: Issues Log ──────────────────────────────────────────────────────

const ISSUE_HEADERS = [
  'Issue_ID', 'Severity', 'Page', 'Issue Title', 'Description',
  'Root Cause (code reference)', 'Impact', 'Recommended Fix', 'Status',
];

const issues = [
  {
    id: 'BUG-001',
    severity: 'High',
    page: 'AuraWelcome.tsx',
    title: 'Double DB query race condition — two useEffects both redirect on session load',
    description: 'AuraWelcome has two separate useEffect hooks that both query aura_sessions and call navigate(). The first (lines 52-77) redirects if step>=2. The second "restore" useEffect (lines 87-145) also queries and redirects for all step ranges. Both fire concurrently on mount, causing two navigate() calls and potential render flicker.',
    root: 'AuraWelcome.tsx lines 52-77 and lines 87-145. Both query supabase.from("aura_sessions") independently with no coordination.',
    impact: 'Returning users may experience double-navigation flicker. React Router navigate() called twice in same render cycle. Could cause inconsistent URL state.',
    fix: 'Merge both useEffects into a single async function. Perform one DB query and handle all redirect logic in one place.',
    status: 'Open',
  },
  {
    id: 'BUG-002',
    severity: 'High',
    page: 'AuraWelcome.tsx',
    title: 'Weak email validation — "@" alone passes isValid check',
    description: 'The isValid check on line 147 uses email.trim().includes("@") which passes for strings like "@", "x@", "@y", "@@". This allows malformed email addresses to be saved to the DB.',
    root: 'AuraWelcome.tsx line 147: const isValid = name.trim().length >= 2 && email.trim().includes("@");',
    impact: 'Invalid email addresses saved to aura_sessions. Downstream email contact attempts will fail.',
    fix: 'Use a proper email regex: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) or use the HTML input type="email" native validation via form element.',
    status: 'Open',
  },
  {
    id: 'BUG-003',
    severity: 'High',
    page: 'AuraInsights.tsx',
    title: 'No session-not-found redirect guard — renders empty state for unauthorized direct access',
    description: 'AuraInsights.tsx does not redirect to /aura/welcome when no aura_sessions record is found. Other pages (AuraChallenge, AuraAssessments, AuraAssessmentIntro) all redirect in the else-branch of their session load. AuraInsights only sets state with setSessionId and setUserName.',
    root: 'AuraInsights.tsx lines 84-87: only sets state when sessionRes.data exists. No else-branch calling navigate("/aura/welcome").',
    impact: 'Users accessing /aura/insights directly with no session see empty insight cards and "No completed assessments found" with a back button — confusing user flow.',
    fix: 'Add else branch in the load function: if (!sessionRes.data) { navigate("/aura/welcome"); return; }',
    status: 'Open',
  },
  {
    id: 'BUG-004',
    severity: 'High',
    page: 'AuraFeedback.tsx',
    title: 'No session guard or step-prerequisite check on /aura/feedback',
    description: 'AuraFeedback.tsx has no DB session load on mount. It only checks auth (if !user navigate("/auth")). Any authenticated user can access /aura/feedback directly, bypass all prior steps, and submit arbitrary feedback that gets saved against no session (session query in handleSubmit may find the wrong session).',
    root: 'AuraFeedback.tsx: no useEffect loading session or checking current_step. Compare to AuraAssessmentIntro.tsx which has full guard.',
    impact: 'Flow integrity broken. Feedback can be submitted out of order. Potential data pollution in aura_sessions.',
    fix: 'Add session load useEffect on mount. Check current_step >= 6 before rendering form. Redirect to correct step if prerequisite not met.',
    status: 'Open',
  },
  {
    id: 'BUG-005',
    severity: 'High',
    page: 'AuraChallenge.tsx',
    title: 'handleConfirmAndContinue has no try/catch — silent failure on DB error',
    description: 'The handleConfirmAndContinue function (lines 164-172) performs an await supabase.from("aura_sessions").update() with no try/catch wrapper. If the DB update fails (network error, expired JWT, RLS violation), the function silently navigates to /aura/assessment-intro without saving user_confirmed=true.',
    root: 'AuraChallenge.tsx lines 164-172: async function with no error handling.',
    impact: 'State may be inconsistent — user progresses in UI but DB not updated. On refresh, user sent back to wrong step.',
    fix: 'Wrap in try/catch, show toast.error on failure, do not navigate on DB error.',
    status: 'Open',
  },
  {
    id: 'BUG-006',
    severity: 'Medium',
    page: 'AuraFuture.tsx',
    title: 'aura_flow_active localStorage flag never cleared after flow completion',
    description: 'AuraFuture.tsx intentionally defers clearing the flag with a comment: "Do NOT clear the aura flag here". However, no downstream page (Welcome.tsx is referenced but code not confirmed) is definitively responsible for calling clearAuraReturnFlag(). If Welcome.tsx fails to clear it or user navigates away, the stale flag persists indefinitely.',
    root: 'AuraFuture.tsx useEffect line 46 comment. clearAuraReturnFlag() in useAuraReturn.ts line 56 is exported but call site in Welcome.tsx not verified in scope.',
    impact: 'Re-entering the Aura flow, assessment completion pages always redirect back to /aura/assessments for users who completed the flow. useAuraReturn hook returns hasAuraSession=true permanently.',
    fix: 'Call clearAuraReturnFlag() explicitly after navigating to /welcome in AuraFuture.tsx, or ensure Welcome.tsx always clears it on mount with a verified code reference.',
    status: 'Open',
  },
  {
    id: 'BUG-007',
    severity: 'Medium',
    page: 'AuraAssessmentIntro.tsx',
    title: 'Step numbering inconsistency — DB step=4 skipped; handleContinue writes step=5',
    description: 'The progress bar in AuraAssessmentIntro shows currentStep={4}. The page\'s handleContinue writes current_step=5 to DB. This means current_step=4 is never written anywhere in the flow. AuraWelcome.tsx "restore" logic checks step>=3 → redirect to /aura/assessment-intro and step>=5 → redirect to /aura/assessments. Step 4 is effectively unused as a DB value.',
    root: 'AuraAssessmentIntro.tsx line 81: update({ current_step: 5 }). AuraWelcome.tsx lines 127-131: step>=3 routes to assessment-intro, step>=5 routes to assessments. Gap at step=4.',
    impact: 'If a user completes assessment-intro (step saved as 5) and refreshes /aura/welcome, they correctly go to assessments. But no resume point at step=4 means partial progress between steps 3 and 5 is not distinguishable.',
    fix: 'Either write current_step=4 when entering assessment-intro (on page load), or document intentional skip. Update AuraWelcome restore logic to handle step>=4 → assessment-intro.',
    status: 'Open',
  },
  {
    id: 'BUG-008',
    severity: 'Medium',
    page: 'AuraFeedback.tsx',
    title: 'Progress bar shows step 6 on feedback page — identical to insights page',
    description: 'AuraFeedback.tsx passes currentStep={6} to AuraProgressBar (line 104). AuraInsights.tsx also passes currentStep={6}. Both pages render at step 6 in the progress bar despite being distinct steps (6 and 6.5). User cannot visually distinguish progress between insights and feedback.',
    root: 'AuraFeedback.tsx line 104: <AuraProgressBar currentStep={6}. AuraProgressBar.tsx only supports integer steps 1-7.',
    impact: 'UX confusion — progress bar does not advance when user moves from insights to feedback.',
    fix: 'Consider using step 7 for feedback in the progress bar and renumbering future step to be outside the bar, or add an 8-step variant.',
    status: 'Open',
  },
  {
    id: 'BUG-009',
    severity: 'Medium',
    page: 'AuraChallenge.tsx',
    title: 'Unsaved challenge text lost on page refresh before AI analysis',
    description: 'AuraChallenge.tsx restores challenge_text from DB only if step>=3 AND identified_themes are present (lines 106-110). If the user typed text but has not yet clicked "Share with Aura" and refreshes, the typed content is lost permanently.',
    root: 'AuraChallenge.tsx lines 106-110: restoration guarded behind step>=3 condition. No localStorage draft mechanism.',
    impact: 'Poor UX — users must retype their challenge description. Risk of abandonment.',
    fix: 'Save challengeText to localStorage on every onChange. On mount, restore from localStorage if no DB result. Clear localStorage draft after successful AI analysis.',
    status: 'Open',
  },
  {
    id: 'BUG-010',
    severity: 'Medium',
    page: 'AuraWelcome.tsx',
    title: 'First useEffect redirect on step>=2 conflicts with second useEffect routing logic',
    description: 'The first useEffect (lines 52-77) only handles step>=2 → /aura/challenge. The second useEffect (lines 87-145) handles all step ranges including step>=2. For users with step=2, the first useEffect navigates to /aura/challenge before the second can run. For higher steps, only the second runs. The division of responsibility is unclear and brittle.',
    root: 'AuraWelcome.tsx two separate useEffects both with navigate calls. First is incomplete (handles only step>=2). Second handles all cases.',
    impact: 'Code maintenance risk. Subtle ordering dependency. Any change to one may break the other.',
    fix: 'Remove the first useEffect DB query entirely. Let the second "restore" useEffect handle all routing logic from a single DB call.',
    status: 'Open',
  },
  {
    id: 'BUG-011',
    severity: 'Medium',
    page: 'generate-coaching-recommendation/index.ts',
    title: 'No authentication check on edge functions — publicly callable',
    description: 'Both analyze-challenge and generate-coaching-recommendation edge functions do not verify the caller\'s Supabase JWT. The generate-coaching-recommendation function has no auth header validation at all. Any HTTP client can call these functions and consume API credits.',
    root: 'generate-coaching-recommendation/index.ts: no Authorization header check, no Deno supabase client auth verification. analyze-challenge/index.ts same issue.',
    impact: 'API cost abuse. Unauthorized access to AI inference. Potentially sensitive coaching data generated for unauthenticated requests.',
    fix: 'Add JWT verification using Supabase\'s createClient with the Authorization header from req.headers.get("Authorization").',
    status: 'Open',
  },
  {
    id: 'BUG-012',
    severity: 'Low',
    page: 'All Aura pages',
    title: 'Blank screen during auth loading — no loading indicator',
    description: 'All Aura page components check "if (loading) return null" before rendering. This shows a blank white screen for the duration of the auth session check (~100-500ms). No spinner, skeleton, or loading state shown.',
    root: 'AuraWelcome.tsx line 197, AuraChallenge.tsx line 181, AuraAssessmentIntro.tsx line 87, AuraAssessments.tsx line 201, AuraInsights.tsx line 186, AuraFeedback.tsx line 99, AuraFuture.tsx line 90.',
    impact: 'Perceived performance degradation. Flash of blank content on every page navigation.',
    fix: 'Return a skeleton/loading component instead of null. Consider a shared AuraPageSkeleton component.',
    status: 'Open',
  },
  {
    id: 'BUG-013',
    severity: 'Low',
    page: 'AuraFuture.tsx',
    title: 'No session guard — AuraFuture renders for any authenticated user',
    description: 'AuraFuture.tsx has no aura_sessions DB lookup on mount. Any authenticated user navigating directly to /aura/future sees the "Coming Soon" content and buttons. The "Go to Dashboard" button navigates to /welcome which may fail if path_committed gate is not met.',
    root: 'AuraFuture.tsx: only checkCoach runs on mount. No session load, no current_step check.',
    impact: 'Flow bypass. Users can access future page without completing the flow.',
    fix: 'Add session load useEffect, check current_step >= 7, redirect to /aura/welcome if not.',
    status: 'Open',
  },
  {
    id: 'BUG-014',
    severity: 'Low',
    page: 'AuraChallenge.tsx',
    title: 'handleExpand resets AI results but does not clear DB themes — re-analysis overwrites correctly but shows stale state briefly',
    description: 'handleExpand (lines 174-179) clears local state (setShowResults, setAuraSummary, setThemes) and shows a toast. However, the DB still has the old identified_themes and aura_summary. If the user clicks "Let me expand" but then navigates away and returns, the old results are restored from DB (lines 106-110) instead of showing the empty input form.',
    root: 'AuraChallenge.tsx lines 164-179: handleExpand only resets local state, does not update DB. Lines 106-110 restore from DB on load.',
    impact: 'Users who click "Let me expand" and refresh see old results, not the empty text input they expect.',
    fix: 'In handleExpand, also clear identified_themes and aura_summary in DB (set to null) and set current_step back to 2.',
    status: 'Open',
  },
  {
    id: 'BUG-015',
    severity: 'Low',
    page: 'AuraInsights.tsx',
    title: 'Continue button only visible when insights AND recommendation both present',
    description: 'The "Continue" button inside the recommendation card is only rendered when recommendation && insights.length > 0 (line 244). If insights.length === 0 (no completed assessments), a "Back to Assessments" button is shown but NO continue button exists. If recommendation string is empty, the button also disappears.',
    root: 'AuraInsights.tsx lines 244-262: Button is inside the recommendation conditional block. If recommendation=""(empty string), falsy check hides it.',
    impact: 'User stuck if recommendation is empty string (not caught by fallback). Fallback only assigns generic text when catch fires or recData.recommendation missing — empty string from AI would not be caught.',
    fix: 'Move the Continue button outside the recommendation block. Add explicit check: recommendation || fallback text always truthy.',
    status: 'Open',
  },
];

// ─── Sheet 3: Flow Coverage Matrix ────────────────────────────────────────────

const MATRIX_DATA = [
  ['Step / Scenario', 'Happy Path', 'Error Handling', 'Edge Case', 'Mobile/Responsive', 'Auth Guard', 'Session Persistence', 'AI Integration'],
  ['Step 1: /aura/welcome',         'TC-001', 'TC-038',  'TC-013, TC-022, TC-023', 'TC-045, TC-046', 'TC-018',     'TC-029', '—'],
  ['Step 2: /aura/challenge (input)', 'TC-002', 'TC-036, TC-037, TC-038', 'TC-014, TC-015', 'TC-045', 'TC-019', 'TC-028, TC-029', 'TC-036-041'],
  ['Step 3: /aura/challenge (confirm)', 'TC-003', 'TC-050', 'TC-020',          'TC-045', '—',          '—',       'TC-040'],
  ['Step 4: /aura/assessment-intro', 'TC-004', '—',       'TC-024',            'TC-045', 'TC-019',    '—',       '—'],
  ['Step 5: /aura/assessments',      'TC-005', 'TC-049',  'TC-021, TC-033, TC-034, TC-035', 'TC-045', 'TC-019', 'TC-030, TC-031', '—'],
  ['Step 6: /aura/insights',         'TC-006', 'TC-039',  'TC-025',            'TC-045', 'TC-019',    '—',       'TC-039, TC-041, TC-042'],
  ['Step 6.5: /aura/feedback',       'TC-007', 'TC-017',  'TC-016, TC-026',    'TC-045', 'TC-018',    '—',       '—'],
  ['Step 7: /aura/future',           'TC-008, TC-009', '—', 'TC-027, TC-032', 'TC-045', 'TC-018',    '—',       '—'],
  ['useAuraReturn hook',             'TC-030', '—',       'TC-031, TC-032',    '—',      '—',         'TC-031',  '—'],
  ['AuthContext',                    'TC-048', 'TC-047',  '—',                 '—',      'TC-018, TC-019', '—',  '—'],
  ['analyze-challenge fn',           'TC-002', 'TC-036, TC-037, TC-038, TC-040', 'TC-041', '—', 'TC-042', '—', 'TC-036-042'],
  ['gen-coaching-recommendation fn', 'TC-006', 'TC-039',  'TC-042',            '—',      'TC-042',    '—',       'TC-039, TC-042'],
];

// ─── Build Workbook ───────────────────────────────────────────────────────────

function makeSheet1(wb) {
  const ws = XLSX.utils.aoa_to_sheet([TC_HEADERS]);

  // Style helpers
  const R = (row, col) => XLSX.utils.encode_cell({ r: row, c: col });

  // Add header styles
  TC_HEADERS.forEach((_, ci) => {
    const addr = R(0, ci);
    if (!ws[addr]) ws[addr] = { v: TC_HEADERS[ci], t: 's' };
    ws[addr].s = headerStyle('1F3864');
  });

  // Add data rows
  testCases.forEach((tc, ri) => {
    const row = [
      tc.id, tc.page, tc.name, tc.pre,
      tc.steps, tc.expected, tc.actual, tc.status, tc.priority, tc.notes,
    ];
    row.forEach((val, ci) => {
      const addr = R(ri + 1, ci);
      ws[addr] = { v: val ?? '', t: 's' };

      let fill = undefined;
      if (ci === 7) fill = STATUS_FILL[tc.status];
      if (ci === 8) fill = PRIORITY_FILL[tc.priority];

      ws[addr].s = {
        ...cellStyle(fill ? { fill } : {}),
        font: {
          sz: 10,
          bold: ci === 0,
          color: ci === 8 && ['P0', 'P1'].includes(tc.priority)
            ? { rgb: tc.priority === 'P0' ? 'FFFFFF' : '000000' }
            : { rgb: '000000' },
        },
        fill: fill ? { fgColor: { rgb: fill }, patternType: 'solid' } : undefined,
        alignment: { wrapText: true, vertical: 'top' },
        border: {
          top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
          bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
          left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
          right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
        },
      };
    });
  });

  // Column widths
  ws['!cols'] = [
    { wch: 10 }, // TC_ID
    { wch: 28 }, // Page
    { wch: 42 }, // Test Name
    { wch: 32 }, // Preconditions
    { wch: 40 }, // Steps
    { wch: 40 }, // Expected
    { wch: 30 }, // Actual
    { wch: 12 }, // Status
    { wch: 10 }, // Priority
    { wch: 38 }, // Notes
  ];

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: testCases.length, c: TC_HEADERS.length - 1 });

  XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');
}

function makeSheet2(wb) {
  const ws = XLSX.utils.aoa_to_sheet([ISSUE_HEADERS]);

  ISSUE_HEADERS.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) ws[addr] = { v: ISSUE_HEADERS[ci], t: 's' };
    ws[addr].s = headerStyle('7B0000');
  });

  issues.forEach((iss, ri) => {
    const row = [
      iss.id, iss.severity, iss.page, iss.title,
      iss.description, iss.root, iss.impact, iss.fix, iss.status,
    ];
    row.forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      ws[addr] = { v: val ?? '', t: 's' };

      let fill = undefined;
      if (ci === 1) fill = SEV_FILL[iss.severity];

      ws[addr].s = {
        font: {
          sz: 10,
          bold: ci === 0,
          color: ci === 1 && ['Critical', 'High'].includes(iss.severity)
            ? { rgb: 'FFFFFF' }
            : { rgb: '000000' },
        },
        fill: fill ? { fgColor: { rgb: fill }, patternType: 'solid' } : undefined,
        alignment: { wrapText: true, vertical: 'top' },
        border: {
          top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
          bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
          left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
          right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
        },
      };
    });
  });

  ws['!cols'] = [
    { wch: 12 }, // Issue_ID
    { wch: 12 }, // Severity
    { wch: 22 }, // Page
    { wch: 42 }, // Title
    { wch: 55 }, // Description
    { wch: 45 }, // Root Cause
    { wch: 38 }, // Impact
    { wch: 40 }, // Fix
    { wch: 12 }, // Status
  ];

  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: issues.length, c: ISSUE_HEADERS.length - 1 });

  XLSX.utils.book_append_sheet(wb, ws, 'Issues Log');
}

function makeSheet3(wb) {
  const ws = XLSX.utils.aoa_to_sheet(MATRIX_DATA);

  // Style header row
  MATRIX_DATA[0].forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (ws[addr]) ws[addr].s = headerStyle('1A5276');
  });

  // Style first column (step labels)
  MATRIX_DATA.slice(1).forEach((_, ri) => {
    const addr = XLSX.utils.encode_cell({ r: ri + 1, c: 0 });
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, sz: 10 },
        fill: { fgColor: { rgb: 'D6EAF8' }, patternType: 'solid' },
        alignment: { wrapText: true, vertical: 'top' },
        border: {
          top:    { style: 'thin', color: { rgb: 'AAAAAA' } },
          bottom: { style: 'thin', color: { rgb: 'AAAAAA' } },
          left:   { style: 'thin', color: { rgb: 'AAAAAA' } },
          right:  { style: 'thin', color: { rgb: 'AAAAAA' } },
        },
      };
    }
    // Style data cells
    for (let ci = 1; ci < MATRIX_DATA[0].length; ci++) {
      const daddr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (ws[daddr]) {
        const val = ws[daddr].v;
        ws[daddr].s = {
          font: { sz: 9, color: { rgb: val === '—' ? 'AAAAAA' : '1A5276' } },
          alignment: { wrapText: true, vertical: 'top', horizontal: 'center' },
          fill: val === '—'
            ? undefined
            : { fgColor: { rgb: 'EBF5FB' }, patternType: 'solid' },
          border: {
            top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
            left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
            right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
          },
        };
      }
    }
  });

  ws['!cols'] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
  ];

  ws['!freeze'] = { xSplit: 1, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Flow Coverage Matrix');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const wb = XLSX.utils.book_new();
makeSheet1(wb);
makeSheet2(wb);
makeSheet3(wb);

XLSX.writeFile(wb, OUTPUT_PATH, { bookType: 'xlsx', cellStyles: true });

console.log(`\nAura QA Test Report generated successfully.`);
console.log(`Output: ${OUTPUT_PATH}`);
console.log(`\nSummary:`);
console.log(`  Test Cases: ${testCases.length}`);
console.log(`  Issues Found: ${issues.length}`);
console.log(`  Fails: ${testCases.filter(tc => tc.status === 'Fail').length} test cases marked Fail`);
console.log(`  P0 cases: ${testCases.filter(tc => tc.priority === 'P0').length}`);
console.log(`  High/Critical bugs: ${issues.filter(i => ['High', 'Critical'].includes(i.severity)).length}`);
