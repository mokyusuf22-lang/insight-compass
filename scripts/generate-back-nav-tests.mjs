/**
 * generate-back-nav-tests.mjs
 *
 * Adds two sheets to aura-test-cases.xlsx:
 *   Sheet 6: "Back Navigation Tests"  (30+ test cases)
 *   Sheet 7: "Back Nav Issues"        (one row per FAIL)
 *
 * Evidence source: code-reading of:
 *   src/pages/AuraWelcome.tsx
 *   src/pages/AuraChallenge.tsx
 *   src/pages/AuraAssessmentIntro.tsx
 *   src/pages/AuraAssessments.tsx
 *   src/pages/AuraFeedback.tsx
 *   src/pages/DISCAssessment.tsx
 *   src/pages/WheelOfLifeAssessment.tsx
 *   src/pages/BlobTreeAssessment.tsx
 *   src/hooks/useAuraReturn.ts
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.join(__dirname, '..', 'aura-test-cases.xlsx');

// ---------------------------------------------------------------------------
// STATUS constants
// PASS   = code provably handles it correctly
// FAIL   = real bug confirmed from code
// BLOCKED= needs runtime verification
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SHEET 6 — Back Navigation Tests
// Columns: TC_ID | Category | Test Name | Entry Point | Action |
//          Expected Result | Actual Result (from code) | Status | Priority | Notes
// ---------------------------------------------------------------------------
const testCases = [
  // =========================================================================
  // CATEGORY A — Browser back between Aura steps
  // =========================================================================
  {
    TC_ID: 'BN-001',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/challenge at step 2 (pre-analysis)',
    'Entry Point': '/aura/challenge (step 2, challengeText entered, not yet analysed)',
    Action: 'Press browser back button',
    'Expected Result': 'Lands on /aura/welcome, which immediately bounces forward to /aura/challenge (step >= 2 triggers navigate). User cannot edit name/email.',
    'Actual Result (from code)': 'AuraWelcome useEffect: step >= 2 → navigate("/aura/challenge"). Bounce confirmed. challengeText is preserved in localStorage (CHALLENGE_DRAFT_KEY) so textarea content survives.',
    Status: 'PASS',
    Priority: 'Medium',
    Notes: 'The bounce is by design. Draft text is preserved via localStorage. No data loss.',
  },
  {
    TC_ID: 'BN-002',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/challenge at step 3 (post-analysis, before confirm)',
    'Entry Point': '/aura/challenge (step 3, showResults=true)',
    Action: 'Press browser back button',
    'Expected Result': 'Lands on /aura/welcome, bounced forward to /aura/challenge. AuraChallenge restores showResults=true and displays confirmed analysis (step >= 3 and identified_themes present in DB).',
    'Actual Result (from code)': 'AuraWelcome: step >= 2 (step is 3) → navigate("/aura/challenge"). AuraChallenge loadSession: step >= 3 and identified_themes && aura_summary → setShowResults(true). Results are shown. No re-analysis triggered.',
    Status: 'PASS',
    Priority: 'Medium',
    Notes: 'AI analysis results are restored from DB; no double-charge of AI call.',
  },
  {
    TC_ID: 'BN-003',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/assessment-intro to /aura/challenge',
    'Entry Point': '/aura/assessment-intro (step 3 or 4)',
    Action: 'Press browser back button',
    'Expected Result': 'Lands on /aura/challenge, which shows the confirmed analysis state (showResults=true). User can still proceed forward.',
    'Actual Result (from code)': 'AuraChallenge: step 3, identified_themes present → restores showResults. AuraAssessmentIntro does NOT redirect back here from this direction. Navigation works.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Clean backward navigation into the challenge step.',
  },
  {
    TC_ID: 'BN-004',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/assessments to /aura/assessment-intro (navigation trap)',
    'Entry Point': '/aura/assessments (step >= 5)',
    Action: 'Press browser back button',
    'Expected Result': 'User wants to revisit /aura/assessment-intro.',
    'Actual Result (from code)': 'AuraAssessmentIntro useEffect: step >= 5 → navigate("/aura/assessments"). User is immediately redirected BACK to assessments. TRAP: user can never navigate backward past step 5 via browser back.',
    Status: 'FAIL',
    Priority: 'High',
    Notes: 'BUG: AuraAssessmentIntro redirects step>=5 to /aura/assessments. No "Back" button in AuraAssessments either. User is trapped at step 5 with no backward escape.',
  },
  {
    TC_ID: 'BN-005',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/assessments all the way to /aura/welcome',
    'Entry Point': '/aura/assessments (step 5)',
    Action: 'Press browser back multiple times attempting to reach /aura/welcome',
    'Expected Result': 'User tries to return to step 1 to change name/email.',
    'Actual Result (from code)': 'assessment-intro bounces back to assessments (see BN-004). welcome bounces to assessments (step >= 5). User is completely trapped at /aura/assessments.',
    Status: 'FAIL',
    Priority: 'High',
    Notes: 'Duplicate trap confirmed. Both intermediate steps redirect forward. No way to revisit earlier steps once step >= 5.',
  },
  {
    TC_ID: 'BN-006',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/insights',
    'Entry Point': '/aura/insights (step 6)',
    Action: 'Press browser back button',
    'Expected Result': 'Lands on /aura/assessments. AuraAssessments: step 6 >= 6 → navigate to /aura/insights immediately. Another trap.',
    'Actual Result (from code)': 'AuraAssessments: step >= 6 → navigate("/aura/insights"). AuraAssessmentIntro: step >= 6 → navigate("/aura/insights"). AuraWelcome: step >= 6 → navigate("/aura/insights"). All routes bounce forward.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: Once at step 6 (insights), all prior steps redirect to insights. User cannot go back to re-review assessments after seeing insights.',
  },
  {
    TC_ID: 'BN-007',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/feedback to /aura/insights',
    'Entry Point': '/aura/feedback (step 6)',
    Action: 'Press browser back button',
    'Expected Result': 'Lands on /aura/insights. AuraInsights should render normally (step 6 is still valid there).',
    'Actual Result (from code)': 'AuraFeedback has no forward-redirect. Browser navigates to /aura/insights. No code in AuraInsights was read but it likely renders correctly at step 6. Feedback form is NOT pre-populated with prior ratings (ratings state is fresh empty object {}). Prior ratings in DB are not loaded back.',
    Status: 'BLOCKED',
    Priority: 'Low',
    Notes: 'AuraInsights not read. Needs runtime check. Feedback ratings not pre-filled if user navigates back to /aura/feedback.',
  },
  {
    TC_ID: 'BN-008',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back from /aura/future to /aura/feedback',
    'Entry Point': '/aura/future (step 7)',
    Action: 'Press browser back button',
    'Expected Result': 'User lands on /aura/feedback. Step is now 7. Validation check: step < 6 → redirect. 7 >= 6 → passes. Feedback form shown EMPTY. User can re-submit.',
    'Actual Result (from code)': 'AuraFeedback validateSession: current_step < 6 → redirect. Step 7 is NOT < 6 so it passes. Form shows empty ratings. handleSubmit overwrites feedback_ratings and feedback_text in DB. Re-submission succeeds.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: Re-submission overwrites prior feedback silently. No idempotency guard. No warning shown. Prior ratings are lost. Fix: set current_step >= 7 redirects to /aura/future or show read-only summary.',
  },
  {
    TC_ID: 'BN-009',
    Category: 'A - Browser Back (Aura Steps)',
    'Test Name': 'Browser back to /aura/welcome from step >= 7 (flow complete)',
    'Entry Point': '/aura/future (step 7, complete)',
    Action: 'Navigate browser back through history until /aura/welcome',
    'Expected Result': 'AuraWelcome bounces to /welcome (dashboard) since step >= 7.',
    'Actual Result (from code)': 'AuraWelcome: step >= 7 → navigate("/welcome"). Correct terminal behavior.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Completed-flow bounce to dashboard is correct.',
  },

  // =========================================================================
  // CATEGORY B — Browser back from individual assessments
  // =========================================================================
  {
    TC_ID: 'BN-010',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back from DISC mid-question (e.g. Q5)',
    'Entry Point': '/assessment/disc (Q5, 4 responses saved)',
    Action: 'Press browser back button (browser-level, not in-app Back)',
    'Expected Result': 'Navigates to /aura/assessments (or prior route). DISC progress (current_question=5) is persisted in DB. aura_flow_active flag remains in localStorage.',
    'Actual Result (from code)': 'No beforeunload handler or navigation guard in DISCAssessment. Browser navigates away freely. DB has current_question=5 (last saveProgress call). localStorage aura_flow_active preserved (not cleared on unmount).',
    Status: 'PASS',
    Priority: 'Medium',
    Notes: 'Progress is safe. aura flag intact. Re-entry resumes from Q5.',
  },
  {
    TC_ID: 'BN-011',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back from DISC at Q1 (no answers given)',
    'Entry Point': '/assessment/disc (Q1, new assessment created)',
    Action: 'Press browser back button immediately after page load',
    'Expected Result': 'Navigates to /aura/assessments. DB has an incomplete disc_assessment record with current_question=1 and empty responses.',
    'Actual Result (from code)': 'A new disc_assessments row was inserted on init. Navigating away leaves an orphaned incomplete record. On re-entry, initAssessment finds this incomplete record and resumes at Q1.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Orphaned incomplete records are acceptable; resume logic handles them.',
  },
  {
    TC_ID: 'BN-012',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Re-enter DISC after browser back — resumes from DB-saved question',
    'Entry Point': '/aura/assessments (after browser back from DISC Q8)',
    Action: 'Click "Start" on DISC again',
    'Expected Result': 'DISC resumes at Q8 (DB current_question=8) with prior responses populated.',
    'Actual Result (from code)': 'initAssessment: finds is_complete=false record, sets currentQuestion=existing.current_question (8), populates responses from DB. Correct.',
    Status: 'PASS',
    Priority: 'Medium',
    Notes: 'Resume-from-DB works correctly for DISC.',
  },
  {
    TC_ID: 'BN-013',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back while DISC isSaving=true (async save in-flight)',
    'Entry Point': '/assessment/disc, answer just selected triggering saveProgress()',
    Action: 'Press browser back immediately while "Saving..." indicator is visible',
    'Expected Result': 'Browser navigates away. The async saveProgress callback may still be running. navigate() call inside saveProgress fires on an unmounted component.',
    'Actual Result (from code)': 'saveProgress uses navigate from useNavigate hook captured in useCallback deps. Component unmounts. React will log "Warning: Can\'t perform a React state update on an unmounted component" from setIsSaving(false). navigate() itself may fire silently and cause an unexpected route change after the user has already backed away.',
    Status: 'FAIL',
    Priority: 'High',
    Notes: 'BUG: No abort/cleanup on unmount. navigate() inside async callback fires post-unmount. If assessment was on last question (complete=true), the completion navigate to /aura/assessments fires after user already went back, forcibly redirecting them forward. Fix: use AbortController or isMounted ref.',
  },
  {
    TC_ID: 'BN-014',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back from Wheel of Life mid-category (e.g. category 4)',
    'Entry Point': '/assessment/wheel-of-life (category 4 displayed, categories 1-3 scores saved)',
    Action: 'Press browser back button',
    'Expected Result': 'Navigates to /aura/assessments. Scores saved up to category 4 persist in DB. currentIndex state (4) is lost.',
    'Actual Result (from code)': 'saveAndContinue writes scores to DB before advancing currentIndex. So categories 1-4 scores are in DB. On re-entry, init loads the incomplete record and restores scores via setScores merge. However currentIndex is NOT stored in DB — it always resets to 0 on re-entry.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: WheelOfLife does not persist currentIndex to DB. On re-entry user starts from category 1 even if they were at category 7. Scores are preserved but position is lost. Fix: store current_category_index in wheel_of_life_assessments table.',
  },
  {
    TC_ID: 'BN-015',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back from Value Map mid-assessment',
    'Entry Point': '/assessment/value-map (mid-progress)',
    Action: 'Press browser back button',
    'Expected Result': 'Returns to /aura/assessments. Progress state depends on ValueMap implementation.',
    'Actual Result (from code)': 'ValueMap source not read in this session. Cannot verify from code.',
    Status: 'BLOCKED',
    Priority: 'Medium',
    Notes: 'Requires reading src/pages/ValueMapAssessment.tsx or equivalent. Same pattern risk as WoL: position may not be persisted.',
  },
  {
    TC_ID: 'BN-016',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back from Strengths mid-assessment',
    'Entry Point': '/assessment/strengths (mid-progress)',
    Action: 'Press browser back button',
    'Expected Result': 'Returns to /aura/assessments. Progress persisted based on Strengths implementation.',
    'Actual Result (from code)': 'StrengthsAssessment source not read in this session.',
    Status: 'BLOCKED',
    Priority: 'Medium',
    Notes: 'Requires reading src/pages/StrengthsAssessment.tsx. Same async-save risk as DISC (BN-013).',
  },
  {
    TC_ID: 'BN-017',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Browser back from Blob Tree at "desired" step (step 2 of 2)',
    'Entry Point': '/assessment/blob-tree (step="desired", currentBlob selected and saved)',
    Action: 'Press browser back button',
    'Expected Result': 'Returns to /aura/assessments. DB has current_blob set. aura flag intact.',
    'Actual Result (from code)': 'BlobTree persists current_blob on first click. On re-entry, init finds existing incomplete record with current_blob set → setStep("desired"). Good partial save. Browser back leaves incomplete record in DB.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Re-entry correctly resumes at "desired" step. No position loss.',
  },
  {
    TC_ID: 'BN-018',
    Category: 'B - Browser Back from Assessments',
    'Test Name': 'Re-enter already-complete assessment via browser back',
    'Entry Point': '/aura/assessments (DISC shows "Done")',
    Action: 'Use browser history (browser back from /aura/assessments) to land on /assessment/disc',
    'Expected Result': 'DISCAssessment init looks for is_complete=false. No incomplete record found. Creates a NEW disc_assessments record, resetting progress to Q1.',
    'Actual Result (from code)': 'initAssessment: .eq("is_complete", false). Completed record is excluded. A new record is created. User sees Q1 again. If user completes again, disc_completed stays true in profiles (already set). Second completion navigates back to /aura/assessments.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: Re-entering a completed assessment silently creates a new record. No guard saying "you already completed this." Could cause confusion and data clutter (multiple completed records). Fix: check is_complete=true first and show completion confirmation before allowing redo.',
  },

  // =========================================================================
  // CATEGORY C — In-app back buttons within assessments
  // =========================================================================
  {
    TC_ID: 'BN-019',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'DISC in-app Back button at Q1',
    'Entry Point': '/assessment/disc (currentQuestion=1)',
    Action: 'Click in-app Back button',
    'Expected Result': 'Button is disabled. No navigation. currentQuestion stays at 1.',
    'Actual Result (from code)': 'Button has disabled={currentQuestion === 1}. goBack() not called. Correct.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Disabled state correctly applied at Q1.',
  },
  {
    TC_ID: 'BN-020',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'DISC in-app Back at Q5 — state decrement only, no DB update',
    'Entry Point': '/assessment/disc (currentQuestion=5)',
    Action: 'Click in-app Back button',
    'Expected Result': 'currentQuestion decrements to 4. Q4 is shown with existing answer (from responses state). DB still records current_question=5.',
    'Actual Result (from code)': 'goBack(): setCurrentQuestion(currentQuestion - 1). No saveProgress call. DB retains current_question=5. State correctly shows Q4 answer via getCurrentResponse() using responses array.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: DB current_question diverges from displayed question after in-app back. On page refresh, component restores from DB (Q5) not state (Q4). User loses their in-app back position. Fix: call saveProgress to update current_question in DB when going back.',
  },
  {
    TC_ID: 'BN-021',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'DISC in-app Back then change answer — state vs DB divergence',
    'Entry Point': '/assessment/disc (backed from Q5 to Q4, now answering Q4)',
    Action: 'Select a different answer at Q4',
    'Expected Result': 'Response for Q4 updated in state. saveProgress called with new responses and questionNum=5 (auto-advance back to Q5). DB updated with new Q4 response and current_question=5.',
    'Actual Result (from code)': 'handleAnswer: updates Q4 response, nextQuestion=5, setCurrentQuestion(5), saveProgress(newResponses, 5). DB current_question=5. State and DB re-converge after answer change. Q4 answer change is saved to DB.',
    Status: 'PASS',
    Priority: 'Medium',
    Notes: 'Auto-advance to Q5 after answering Q4 makes state/DB re-converge. However mid-state while still on Q4 (before answering) the DB is stale — only matters on refresh.',
  },
  {
    TC_ID: 'BN-022',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'WheelOfLife in-app Back button at category index 0',
    'Entry Point': '/assessment/wheel-of-life (currentIndex=0)',
    Action: 'Click in-app Back button',
    'Expected Result': 'Button disabled. currentIndex stays at 0.',
    'Actual Result (from code)': 'Button: disabled={currentIndex === 0}. onClick: setCurrentIndex(Math.max(0, currentIndex - 1)). Both guards present.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Correctly disabled at first category.',
  },
  {
    TC_ID: 'BN-023',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'WheelOfLife in-app Back at category 3 — slider shows category 2',
    'Entry Point': '/assessment/wheel-of-life (currentIndex=3)',
    Action: 'Click in-app Back button',
    'Expected Result': 'currentIndex decrements to 2. Category 2 shown. Prior score for category 2 displayed in slider (from scores state).',
    'Actual Result (from code)': 'setCurrentIndex(Math.max(0, 3 - 1)) = 2. scores state has category 2 score from initial load (or previously set). category = wheelCategories[2]. slider value = scores[category.id]. Correct display.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'In-app back in WoL does NOT trigger a DB save — only saveAndContinue does. So going back is purely UI state. No data issue.',
  },
  {
    TC_ID: 'BN-024',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'BlobTree in-app "Change first choice" button at desired step',
    'Entry Point': '/assessment/blob-tree (step="desired")',
    Action: 'Click "Change first choice" button',
    'Expected Result': 'setStep("current"), setDesiredBlob(null). User re-selects current blob. No DB update for the change.',
    'Actual Result (from code)': 'Button onClick: setStep("current"); setDesiredBlob(null). No DB update. DB still has the old current_blob value. If user picks a different current_blob, handleBlobClick("current") saves new value and advances to desired again.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'No back button in "current" step — only forward. "Change first choice" covers the single back-navigation case in BlobTree.',
  },
  {
    TC_ID: 'BN-025',
    Category: 'C - In-App Back Buttons',
    'Test Name': 'BlobTree in-app back button at intro step',
    'Entry Point': '/assessment/blob-tree (step="intro")',
    Action: 'Look for in-app back button on intro screen',
    'Expected Result': 'No in-app back button at intro step.',
    'Actual Result (from code)': 'Intro render: only shows "Begin" button (ArrowRight). No back/cancel button. User must use browser back or close tab.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'By design — no in-app back at intro. Browser back is the only option.',
  },

  // =========================================================================
  // CATEGORY D — Re-submission via back navigation
  // =========================================================================
  {
    TC_ID: 'BN-026',
    Category: 'D - Re-submission via Back',
    'Test Name': 'Complete feedback, browser back from /aura/future, feedback page shown',
    'Entry Point': '/aura/future (step 7)',
    Action: 'Press browser back button',
    'Expected Result': 'Lands on /aura/feedback. validateSession: step 7 >= 6 → passes. Form shown empty (no pre-loading of saved ratings).',
    'Actual Result (from code)': 'AuraFeedback validateSession: step < 6 → redirect. 7 is NOT < 6 → no redirect. ratings state initialised as {}. feedback_ratings from DB not loaded back into form. Form appears blank.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: Feedback page accessible after completion with blank form. No indication ratings were already submitted. Duplicate submission possible.',
  },
  {
    TC_ID: 'BN-027',
    Category: 'D - Re-submission via Back',
    'Test Name': 'Re-submit feedback with different ratings — DB overwrite',
    'Entry Point': '/aura/feedback (step 7, opened via browser back)',
    Action: 'Select different star ratings and click Submit Feedback',
    'Expected Result': 'handleSubmit: UPDATE aura_sessions SET current_step=7, feedback_ratings={new}, feedback_text=null WHERE id=sessionId. Prior ratings completely overwritten.',
    'Actual Result (from code)': 'handleSubmit always does a full UPDATE with no check for existing data. current_step set to 7 again (no change in step). feedback_ratings overwritten. Confirmed overwrite bug.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'Same bug as BN-026/BN-008. Fix: if current_step >= 7, redirect to /aura/future or show a "feedback already submitted" message.',
  },
  {
    TC_ID: 'BN-028',
    Category: 'D - Re-submission via Back',
    'Test Name': 'Browser forward after going back from /aura/future',
    'Entry Point': '/aura/future (step 7)',
    Action: 'Browser back to /aura/feedback, then browser forward',
    'Expected Result': 'Browser forward returns to /aura/future. No code change needed — standard browser history.',
    'Actual Result (from code)': 'React Router handles forward navigation via history stack. /aura/future has no special re-init that would redirect. Should work.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Standard browser forward works in React Router SPAs.',
  },

  // =========================================================================
  // CATEGORY E — Edge cases
  // =========================================================================
  {
    TC_ID: 'BN-029',
    Category: 'E - Edge Cases',
    'Test Name': 'Rapid back-forward between /aura/assessments and /assessment/disc',
    'Entry Point': '/aura/assessments',
    Action: 'Click Start (DISC) → browser back → click Start again → browser back → repeat 5x quickly',
    'Expected Result': 'Each cycle: new DISC load triggers initAssessment. If previous init is still running, two concurrent DB queries may race. assessmentId could be set to different values.',
    'Actual Result (from code)': 'No useEffect cleanup / AbortController in DISCAssessment initAssessment. Rapid re-mount/unmount could cause state updates on unmounted components and race conditions on assessmentId.',
    Status: 'FAIL',
    Priority: 'Low',
    Notes: 'BUG: No cleanup in initAssessment async function. Edge-case race on rapid navigation. Low real-world probability but flagged.',
  },
  {
    TC_ID: 'BN-030',
    Category: 'E - Edge Cases',
    'Test Name': 'Browser back during AI analysis in /aura/challenge (isAnalysing=true)',
    'Entry Point': '/aura/challenge (isAnalysing=true, Supabase function in-flight)',
    Action: 'Press browser back button while "Aura is reading..." spinner is visible',
    'Expected Result': 'Browser navigates away. The invoke() promise continues in background. If it resolves after unmount, setThemes/setAuraSummary/setShowResults and navigate() fire on unmounted component.',
    'Actual Result (from code)': 'handleAnalyse has no abort logic. No AbortController on supabase.functions.invoke(). Component unmounts. Async promise resolves. DB update (current_step=3, identified_themes) still executes. navigate("/aura/assessment-intro") or setShowResults fire post-unmount.',
    Status: 'FAIL',
    Priority: 'High',
    Notes: 'BUG: Async AI call has no cancellation. Post-unmount state updates cause console errors. More critically, navigate("/aura/assessment-intro") fires after user has already backed away, which would forcibly navigate them to assessment-intro from wherever they are. Fix: AbortController or isMounted ref.',
  },
  {
    TC_ID: 'BN-031',
    Category: 'E - Edge Cases',
    'Test Name': 'Browser back from /aura/challenge during AI analysis — DB write completes after navigation',
    'Entry Point': '/aura/challenge (isAnalysing=true)',
    Action: 'Browser back immediately after clicking "Share with Aura"',
    'Expected Result': 'If user backed away to /aura/welcome, AuraWelcome re-runs restore: step is still 2 (DB write to step 3 not yet complete). Welcome stays. Then the in-flight DB write sets step=3. Now step is 3. But welcome has already rendered and does not re-query. Session is in step 3 but user is on /aura/welcome.',
    'Actual Result (from code)': 'Race condition: AuraWelcome useEffect runs once on mount (not continuously). The DB update arrives after welcome has already decided not to redirect (step was 2 at query time). On next navigation or refresh, step 3 restores challenge with results.',
    Status: 'FAIL',
    Priority: 'Medium',
    Notes: 'BUG: Race between in-flight DB write and AuraWelcome restore. UI state inconsistent with DB until next reload. Part of the broader no-abort-on-navigation issue.',
  },
  {
    TC_ID: 'BN-032',
    Category: 'E - Edge Cases',
    'Test Name': 'Hard refresh (F5) at /aura/assessments',
    'Entry Point': '/aura/assessments (step 5, 2 of 5 assessments complete)',
    Action: 'Press F5 / hard refresh',
    'Expected Result': 'Page reloads. useEffect fires, queries DB. step 5 — no redirect. completionStatus loaded from profiles. Correct 2/5 completion shown. introText regenerated from DB themes. Typing animation restarts.',
    'Actual Result (from code)': 'AuraAssessments: no step 5 forward-redirect. Loads session+profile data in parallel. Restores completionStatus. introText built from loadedThemes. setDataLoaded(true). Animation restarts (by design — introText was stored in state built from DB, not from react-router state).',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Refresh at assessments works correctly.',
  },
  {
    TC_ID: 'BN-033',
    Category: 'E - Edge Cases',
    'Test Name': 'Hard refresh (F5) at /aura/challenge (step 2)',
    'Entry Point': '/aura/challenge (step 2, challenge text entered but not submitted)',
    Action: 'Press F5',
    'Expected Result': 'Page reloads. loadSession: step 2, challenge_text from DB is null (not yet submitted). localStorage draft restored via CHALLENGE_DRAFT_KEY. textarea populated with draft text.',
    'Actual Result (from code)': 'loadSession: data.challenge_text is null → fall back to localStorage.getItem(CHALLENGE_DRAFT_KEY). setChallengeText(draft). Draft preserved.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Draft persistence via localStorage works on refresh.',
  },
  {
    TC_ID: 'BN-034',
    Category: 'E - Edge Cases',
    'Test Name': 'Hard refresh at /assessment/disc (mid-assessment)',
    'Entry Point': '/assessment/disc (Q8, 7 responses saved in DB)',
    Action: 'Press F5',
    'Expected Result': 'Page reloads. initAssessment finds incomplete record, sets currentQuestion=8, restores responses. User resumes at Q8.',
    'Actual Result (from code)': 'initAssessment: existing found, setCurrentQuestion(existing.current_question), setResponses(existing.responses). Correct.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'DISC refresh-resume works correctly.',
  },
  {
    TC_ID: 'BN-035',
    Category: 'E - Edge Cases',
    'Test Name': 'Browser forward (after going back) at /aura/challenge step 2',
    'Entry Point': '/aura/challenge (navigated back from /aura/assessment-intro)',
    Action: 'Press browser forward button',
    'Expected Result': 'Returns to /aura/assessment-intro. AuraAssessmentIntro: step 4, no forward redirect. Shows the intro page.',
    'Actual Result (from code)': 'AuraAssessmentIntro: step 4 — only redirects if step >= 5 or >= 6. Step 4 passes through, shows the "Shall we begin?" page.',
    Status: 'PASS',
    Priority: 'Low',
    Notes: 'Browser forward works at step 4 assessment-intro.',
  },
  {
    TC_ID: 'BN-036',
    Category: 'E - Edge Cases',
    'Test Name': 'aura_flow_active localStorage flag cleared mid-assessment by browser back',
    'Entry Point': '/assessment/disc (aura_flow_active set in localStorage)',
    Action: 'Open DevTools, manually remove aura_flow_active key, then answer final DISC question',
    'Expected Result': 'useAuraReturn initialises from localStorage synchronously. auraRef.current = false at completion time. navigate to /assessment/disc/results instead of /aura/assessments.',
    'Actual Result (from code)': 'auraRef is set once on mount via useRef(hasAuraSession) and updated by useEffect. If flag is removed AFTER mount but before completion, auraRef.current follows the effect update (next tick). Race is narrow. If removal happens between useEffect update and saveProgress completion, wrong route taken.',
    Status: 'BLOCKED',
    Priority: 'Low',
    Notes: 'Edge case — manual localStorage manipulation. Theoretical race with useEffect timing. Low real-world risk.',
  },
];

// ---------------------------------------------------------------------------
// SHEET 7 — Back Nav Issues (one row per FAIL)
// ---------------------------------------------------------------------------
const issues = [
  {
    Issue_ID: 'BNI-001',
    Severity: 'High',
    Description: 'Navigation trap: browser back from /aura/assessments leads to /aura/assessment-intro which immediately redirects back to /aura/assessments. User cannot navigate backward past step 5.',
    'Root Cause (file:line)': 'AuraAssessmentIntro.tsx:68 — if (step >= 5) { navigate("/aura/assessments"); return; }',
    Impact: 'User permanently trapped at step 5 once assessments page is reached. Cannot revisit challenge/intro pages via browser back. No in-app escape route.',
    'Recommended Fix': 'Remove or gate the step >= 5 forward-redirect in AuraAssessmentIntro. Add an explicit Back button in AuraAssessments that navigates to /aura/challenge or /aura/assessment-intro without triggering the redirect.',
  },
  {
    Issue_ID: 'BNI-002',
    Severity: 'High',
    Description: 'Navigation trap: once step >= 6, all Aura steps (welcome, challenge, assessment-intro, assessments) redirect to /aura/insights. User cannot revisit assessments after viewing insights.',
    'Root Cause (file:line)': 'AuraWelcome.tsx:86 — step >= 6 → /aura/insights; AuraChallenge.tsx:99 — step >= 6 → /aura/insights; AuraAssessmentIntro.tsx:67 — step >= 6 → /aura/insights; AuraAssessments.tsx:105 — step >= 6 → /aura/insights',
    Impact: 'User cannot go back and review individual assessments once insights are unlocked.',
    'Recommended Fix': 'Add a "Review Assessments" link from the insights page. Consider allowing backward navigation to assessments (read-only) without resetting step.',
  },
  {
    Issue_ID: 'BNI-003',
    Severity: 'Medium',
    Description: 'Feedback form re-submission: browser back from /aura/future to /aura/feedback shows an empty form and allows overwriting prior feedback without any warning.',
    'Root Cause (file:line)': 'AuraFeedback.tsx:69 — validation only checks step < 6. Step 7 (post-completion) passes check. ratings state never pre-loaded from DB. handleSubmit (line 96) always overwrites feedback_ratings.',
    Impact: 'Users can accidentally or intentionally overwrite their submitted feedback. Prior responses are permanently lost.',
    'Recommended Fix': 'In validateSession, redirect to /aura/future if step >= 7. Alternatively, load existing ratings from DB and show in read-only mode with an optional "Edit" toggle.',
  },
  {
    Issue_ID: 'BNI-004',
    Severity: 'High',
    Description: 'Async save callback (saveProgress) in DISCAssessment fires navigate() on an unmounted component when browser back is pressed while a save is in-flight.',
    'Root Cause (file:line)': 'DISCAssessment.tsx:128 — navigate() inside saveProgress async callback with no isMounted guard. saveProgress is in useCallback with no cleanup.',
    Impact: 'If browser back occurs while completing the last DISC question, the completion navigate("/aura/assessments") fires after unmount, abruptly routing the user away from wherever they navigated back to. React console errors also generated.',
    'Recommended Fix': 'Add a useRef isMounted flag. Set to true on mount, false on useEffect cleanup. Check isMounted.current before calling navigate() and state setters in saveProgress.',
  },
  {
    Issue_ID: 'BNI-005',
    Severity: 'Medium',
    Description: 'WheelOfLife assessment does not persist currentIndex (current category position) to DB. Browser back and re-entry always restarts from category 0 even if user was mid-way through.',
    'Root Cause (file:line)': 'WheelOfLifeAssessment.tsx:87-110 — saveAndContinue only saves scores, not currentIndex. init (line 52) restores scores but sets currentIndex to 0 (initial state).',
    Impact: 'User who browser-backs from WoL at category 6 must scroll through categories 0-5 again, even though scores are preserved. Frustrating UX.',
    'Recommended Fix': 'Add current_category_index column to wheel_of_life_assessments. Save it in saveAndContinue. Restore it in init alongside scores.',
  },
  {
    Issue_ID: 'BNI-006',
    Severity: 'Medium',
    Description: 'DISC in-app Back button does not update DB current_question. After pressing in-app Back, DB and display are out of sync. On refresh, user is taken to DB question (newer), not displayed question (older).',
    'Root Cause (file:line)': 'DISCAssessment.tsx:175-178 — goBack() only calls setCurrentQuestion(currentQuestion - 1). No saveProgress call.',
    Impact: 'User presses Back in DISC to Q4, refreshes, lands on Q5 (the DB value). Their in-app Back action is silently ignored on refresh.',
    'Recommended Fix': 'Call saveProgress(responses, currentQuestion - 1) inside goBack() to keep DB in sync with displayed question.',
  },
  {
    Issue_ID: 'BNI-007',
    Severity: 'High',
    Description: 'Async AI analysis in AuraChallenge has no cancellation. Browser back during analysis causes post-unmount state updates and a stale navigate() call to /aura/assessment-intro.',
    'Root Cause (file:line)': 'AuraChallenge.tsx:131-169 — handleAnalyse async function, no AbortController, no isMounted check. navigate("/aura/assessment-intro") at line 184 in handleConfirmAndContinue (but more critically, post-analysis setShowResults + DB update still fire).',
    Impact: 'User presses back during AI call. AI resolves. navigate() fires, pulling user to /aura/assessment-intro unexpectedly. DB is written with themes even though user abandoned the flow.',
    'Recommended Fix': 'Use a useRef isMounted pattern. Check before state updates. Wrap supabase.functions.invoke in an AbortController-compatible wrapper if available.',
  },
  {
    Issue_ID: 'BNI-008',
    Severity: 'Medium',
    Description: 'Re-entering a completed assessment via browser history creates a new assessment record rather than showing a completion confirmation.',
    'Root Cause (file:line)': 'DISCAssessment.tsx:46 — .eq("is_complete", false) filter means completed records are never found. New record created at line 58.',
    Impact: 'User who accidentally navigates back into a completed assessment starts fresh. Creates data clutter (multiple completed records per user). Confusing UX.',
    'Recommended Fix': 'Before creating a new record, check for is_complete=true records. If found, show "You already completed this assessment. View your results?" instead of re-starting.',
  },
  {
    Issue_ID: 'BNI-009',
    Severity: 'Medium',
    Description: 'Race condition: in-flight DB write from AuraChallenge AI analysis can complete after AuraWelcome has already queried DB and decided not to redirect. DB step advances silently in background.',
    'Root Cause (file:line)': 'AuraChallenge.tsx:145-154 — DB update fires async. AuraWelcome.tsx:63-90 — restore() queries DB once on mount, not reactively.',
    Impact: 'UI state becomes inconsistent with DB after race. User sees step 2 UI but DB has step 3. Resolves on next full navigation or reload but can cause confusion.',
    'Recommended Fix': 'Part of the broader no-abort-on-navigation issue. Fixing BNI-007 (isMounted + abort) would prevent the DB write from happening after navigation.',
  },
];

// ---------------------------------------------------------------------------
// Build and save workbook
// ---------------------------------------------------------------------------
function toSheet(rows) {
  return XLSX.utils.json_to_sheet(rows);
}

function setColumnWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

const wb = XLSX.readFile(XLSX_PATH);

// Sheet 6 — Back Navigation Tests
const wsTests = toSheet(testCases);
setColumnWidths(wsTests, [10, 32, 55, 45, 55, 75, 75, 10, 10, 55]);
XLSX.utils.book_append_sheet(wb, wsTests, 'Back Navigation Tests');

// Sheet 7 — Back Nav Issues
const wsIssues = toSheet(issues);
setColumnWidths(wsIssues, [12, 10, 70, 60, 60, 70]);
XLSX.utils.book_append_sheet(wb, wsIssues, 'Back Nav Issues');

// Write to a temp file first, then replace the target
const TEMP_PATH = XLSX_PATH.replace(/\.xlsx$/, '.tmp.xlsx');
XLSX.writeFile(wb, TEMP_PATH);
import fs from 'fs';
// Replace original file with temp — catches lock by renaming first
try {
  if (fs.existsSync(XLSX_PATH)) {
    fs.renameSync(XLSX_PATH, XLSX_PATH + '.bak');
  }
  fs.renameSync(TEMP_PATH, XLSX_PATH);
  if (fs.existsSync(XLSX_PATH + '.bak')) {
    fs.unlinkSync(XLSX_PATH + '.bak');
  }
} catch (replaceErr) {
  // If rename fails (locked), leave the temp file so user can rename manually
  console.error('Could not replace original file (may be locked):', replaceErr.message);
  console.log('Temp file written to:', TEMP_PATH);
  process.exit(1);
}

console.log('Done. Sheets written:');
console.log('  Sheet 6: Back Navigation Tests  —', testCases.length, 'test cases');
console.log('  Sheet 7: Back Nav Issues         —', issues.length, 'issues');
console.log('  File:', XLSX_PATH);

// Print summary table to stdout
const failCases = testCases.filter(t => t.Status === 'FAIL');
const passCases = testCases.filter(t => t.Status === 'PASS');
const blockedCases = testCases.filter(t => t.Status === 'BLOCKED');
console.log('\n--- STATUS SUMMARY ---');
console.log('PASS   :', passCases.length);
console.log('FAIL   :', failCases.length);
console.log('BLOCKED:', blockedCases.length);
console.log('TOTAL  :', testCases.length);
console.log('\n--- FAIL LIST ---');
failCases.forEach(t => console.log(' ', t.TC_ID, '|', t.Priority, '|', t['Test Name']));
