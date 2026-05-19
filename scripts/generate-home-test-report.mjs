/**
 * generate-home-test-report.mjs
 *
 * Reads the existing aura-test-cases.xlsx (3 sheets), then appends:
 *   Sheet 4: "Home Page Test Cases"  — 53 test cases for /welcome and /path
 *   Sheet 5: "Home Page Issues"      — bugs identified from code review
 *
 * Run: node scripts/generate-home-test-report.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.resolve(__dirname, '..', 'aura-test-cases.xlsx');

// ─── Style helpers ────────────────────────────────────────────────────────────

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
    fill: opts.fill
      ? { fgColor: { rgb: opts.fill }, patternType: 'solid' }
      : undefined,
    border: {
      top:    { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left:   { style: 'thin', color: { rgb: 'DDDDDD' } },
      right:  { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  };
}

const STATUS_FILL = {
  Pass:         'C6EFCE',
  Fail:         'FFC7CE',
  Blocked:      'FFEB9C',
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

// ─── Sheet 4 data: Test Cases ─────────────────────────────────────────────────

const TC_HEADERS = [
  'TC_ID', 'Page', 'Test Name', 'Preconditions',
  'Test Steps', 'Expected Result', 'Actual Result (from code)', 'Status',
  'Priority', 'Bug_ID',
];

/**
 * Evidence notes for each Pass/Fail/Blocked determination:
 *
 * PASS  = code clearly implements the behavior
 * FAIL  = code has demonstrable bug or missing logic
 * BLOCKED = cannot determine without runtime (DB state, live auth, etc.)
 */
const testCases = [
  // ── Welcome page — Auth & Init ─────────────────────────────────────────────
  {
    id: 'HP-001',
    page: '/welcome (Welcome.tsx)',
    name: 'Auth redirect: unauthenticated user is sent to /auth',
    pre: 'User is not authenticated (user = null, loading = false).',
    steps: '1. Navigate to /welcome while logged out.',
    expected: 'Redirect to /auth.',
    actual: 'useEffect at line 35 checks !loading && !user → navigate("/auth"). Logic is correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-002',
    page: '/welcome (Welcome.tsx)',
    name: 'aura_flow_active localStorage flag cleared on mount',
    pre: 'localStorage has aura_flow_active set to user.id.',
    steps: '1. Load /welcome with flag present.',
    expected: 'clearAuraReturnFlag() called; flag removed from localStorage.',
    actual: 'useEffect at line 41 calls clearAuraReturnFlag() with empty dep array — fires on every mount. clearAuraReturnFlag() calls localStorage.removeItem(AURA_RETURN_KEY). Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-003',
    page: '/welcome (Welcome.tsx)',
    name: 'Loading state shown while data is being fetched',
    pre: 'User is authenticated; loadingData = true.',
    steps: '1. Navigate to /welcome.\n2. Observe UI before Supabase queries resolve.',
    expected: 'LoadingSpinner shown with text "Loading your workspace...".',
    actual: 'Line 99: if (loading || loadingData) returns LoadingSpinner. loadingData initialised to true (line 26). Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-004',
    page: '/welcome (Welcome.tsx)',
    name: 'Username shown as display_name from user_metadata',
    pre: 'user.user_metadata.display_name = "Alice".',
    steps: '1. Load /welcome.',
    expected: 'Heading reads "Welcome back, Alice".',
    actual: 'Line 107: userName = user?.user_metadata?.display_name || ...; Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-005',
    page: '/welcome (Welcome.tsx)',
    name: 'Username falls back to email prefix when display_name is absent',
    pre: 'user.user_metadata.display_name is null; user.email = "bob@example.com".',
    steps: '1. Load /welcome.',
    expected: 'Heading reads "Welcome back, bob".',
    actual: 'Line 107: || user?.email?.split("@")[0] fallback. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-006',
    page: '/welcome (Welcome.tsx)',
    name: 'Username falls back to "there" when both display_name and email are absent',
    pre: 'user.user_metadata.display_name = null; user.email = null.',
    steps: '1. Load /welcome.',
    expected: 'Heading reads "Welcome back, there".',
    actual: 'Line 107: || "there" final fallback. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },

  // ── Welcome page — UI State cards ─────────────────────────────────────────
  {
    id: 'HP-007',
    page: '/welcome (Welcome.tsx)',
    name: 'State: path not committed → "Complete Your Be:More Journey" card shown',
    pre: 'profile.path_committed = false/undefined; hasPersonalPath = false.',
    steps: '1. Load /welcome with uncommitted profile.',
    expected: '"Complete Your Be:More Journey" card rendered.',
    actual: 'Line 174: {!profile?.path_committed && (<div ... "Complete Your Be:More Journey"> ...)}. Correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-008',
    page: '/welcome (Welcome.tsx)',
    name: 'State: path_committed + has coach + no active path → "Your Coach is Building Your Path" card',
    pre: 'profile.path_committed = true; hasCoach = true; hasPersonalPath = false.',
    steps: '1. Load /welcome in this state.',
    expected: '"Your Coach is Building Your Path" card shown with coach name and Message button.',
    actual: 'Line 197: {profile?.path_committed && !hasPersonalPath && hasCoach && ...}. Correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-009',
    page: '/welcome (Welcome.tsx)',
    name: 'State: path_committed + no coach + no path → "Path Coming Soon" card shown',
    pre: 'profile.path_committed = true; hasCoach = false; hasPersonalPath = false.',
    steps: '1. Load /welcome in this state.',
    expected: '"Path Coming Soon" card shown.',
    actual: 'Line 224: {profile?.path_committed && !hasPersonalPath && !hasCoach && ...}. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-010',
    page: '/welcome (Welcome.tsx)',
    name: 'State: has active personal path → Skill Path card shown',
    pre: 'personal_paths returns an active row; hasPersonalPath = true.',
    steps: '1. Load /welcome with active path.',
    expected: '"Your Skill Path" card with title, progress bar, and CTA button rendered.',
    actual: 'Line 143: {hasPersonalPath && (<div ... "Your Skill Path">)}. Correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-011',
    page: '/welcome (Welcome.tsx)',
    name: 'Personal path card displays correct title from DB',
    pre: 'pathRes.data.title = "Leadership Essentials".',
    steps: '1. Load /welcome with path.',
    expected: 'Card heading shows "Leadership Essentials".',
    actual: 'Line 76: setPathTitle(pathRes.data.title). Line 151: <h2>{pathTitle}</h2>. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-012',
    page: '/welcome (Welcome.tsx)',
    name: 'Personal path card shows correct progress percentage on progress bar',
    pre: 'pathRes.data.total_progress = 42.',
    steps: '1. Load /welcome with path at 42%.',
    expected: 'Progress bar shows 42%. Label "42%" visible.',
    actual: 'Line 77: setPathProgress(pathRes.data.total_progress). Lines 157-159: {pathProgress}% and <Progress value={pathProgress}>. NOTE: this uses DB total_progress directly, not recalculated from tasks. Correct for Welcome page; see BUG-H004 for reliability concern.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-013',
    page: '/welcome (Welcome.tsx)',
    name: 'Path 0% → button text is "Start Path"',
    pre: 'pathProgress = 0.',
    steps: '1. Load /welcome with path at 0%.',
    expected: 'CTA button reads "Start Path".',
    actual: 'Line 167: {pathProgress > 0 ? "Continue Path" : "Start Path"}. 0 > 0 is false → "Start Path". Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-014',
    page: '/welcome (Welcome.tsx)',
    name: 'Path > 0% → button text is "Continue Path"',
    pre: 'pathProgress = 25.',
    steps: '1. Load /welcome with path at 25%.',
    expected: 'CTA button reads "Continue Path".',
    actual: 'Line 167: pathProgress > 0 (25 > 0 = true) → "Continue Path". Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-015',
    page: '/welcome (Welcome.tsx)',
    name: 'Path card CTA button navigates to /path',
    pre: 'User clicks the path card button.',
    steps: '1. Click "Start Path" or "Continue Path" button.',
    expected: 'Navigates to /path.',
    actual: 'Line 165: onClick={() => navigate("/path")}. Correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-016',
    page: '/welcome (Welcome.tsx)',
    name: 'Coach application pending → "under review" banner shown',
    pre: 'coach_applications row has status = "pending" for user.',
    steps: '1. Load /welcome with pending application.',
    expected: 'Banner reading "Your coach application is under review." shown.',
    actual: 'Line 70: (appRes.data as any)?.status === "pending" → setCoachAppPending(true). Line 130: {coachAppPending && <banner>}. NOTE: if appRes.error is set but appRes.data is null, the check correctly does not set coachAppPending. Safe for error path. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-017',
    page: '/welcome (Welcome.tsx)',
    name: 'Coach assigned → Coach card shown with first initial of coach name',
    pre: 'hasCoach = true; coachName = "Sarah".',
    steps: '1. Load /welcome with assigned coach.',
    expected: 'Coach card shown. Avatar displays "S".',
    actual: 'Line 243: {coachName && (<div ... coach card>)}. Line 247: {coachName[0].toUpperCase()}. Correct when coachName is non-empty. BUG-H001 exists for empty string edge case.',
    status: 'Pass',
    priority: 'P1',
    bug: 'BUG-H001',
  },
  {
    id: 'HP-018',
    page: '/welcome (Welcome.tsx)',
    name: 'Coach card "Message" button navigates to /my-coach',
    pre: 'Coach card is visible.',
    steps: '1. Click "Message" button on coach card.',
    expected: 'Navigate to /my-coach.',
    actual: 'Line 254: onClick={() => navigate("/my-coach")}. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-019',
    page: '/welcome (Welcome.tsx)',
    name: 'Quick Stats grid shown only when hasPersonalPath = true',
    pre: 'hasPersonalPath = false.',
    steps: '1. Load /welcome with no active path.',
    expected: 'Quick Stats grid NOT rendered.',
    actual: 'Line 266: {hasPersonalPath && (<div className="grid ...">)}. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-020',
    page: '/welcome (Welcome.tsx)',
    name: 'Status stat: 0% progress → "Ready to Start"',
    pre: 'pathProgress = 0.',
    steps: '1. Load /welcome with 0% path.',
    expected: 'Status stat shows "Ready to Start".',
    actual: 'Line 274: pathProgress === 100 ? "Complete!" : pathProgress > 0 ? "In Progress" : "Ready to Start". 0 hits last branch. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-021',
    page: '/welcome (Welcome.tsx)',
    name: 'Status stat: 1–99% progress → "In Progress"',
    pre: 'pathProgress = 50.',
    steps: '1. Load /welcome with 50% path.',
    expected: 'Status stat shows "In Progress".',
    actual: 'Line 274: 50 > 0 → "In Progress". Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-022',
    page: '/welcome (Welcome.tsx)',
    name: 'Status stat: 100% progress → "Complete!"',
    pre: 'pathProgress = 100.',
    steps: '1. Load /welcome with 100% path.',
    expected: 'Status stat shows "Complete!".',
    actual: 'Line 274: 100 === 100 → "Complete!". Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-023',
    page: '/welcome (Welcome.tsx)',
    name: 'Progress stat shows correct percentage value',
    pre: 'pathProgress = 73.',
    steps: '1. Load /welcome with 73% path.',
    expected: 'Progress stat card shows "73%".',
    actual: 'Line 282: <p>{pathProgress}%</p>. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-024',
    page: '/welcome (Welcome.tsx)',
    name: 'Path title truncated in Quick Stats "Path" card',
    pre: 'pathTitle = "A Very Long Skill Path Title That Could Overflow".',
    steps: '1. Load /welcome with long path title.',
    expected: 'Title truncated with ellipsis in stat card.',
    actual: 'Line 289: <p className="text-lg font-semibold truncate">{pathTitle}</p>. Tailwind truncate class applied. Correct.',
    status: 'Pass',
    priority: 'P3',
    bug: '',
  },
  {
    id: 'HP-025',
    page: '/welcome (Welcome.tsx)',
    name: 'Subtitle: has personal path → "Your skill path is ready..." text shown',
    pre: 'hasPersonalPath = true.',
    steps: '1. Load /welcome with active path.',
    expected: 'Subtitle: "Your skill path is ready. Let\'s make progress."',
    actual: 'Line 120: hasPersonalPath → first branch. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-026',
    page: '/welcome (Welcome.tsx)',
    name: 'Subtitle: has coach but no path → "Your coach is preparing..." text shown',
    pre: 'hasPersonalPath = false; hasCoach = true.',
    steps: '1. Load /welcome in this state.',
    expected: 'Subtitle: "Your coach is preparing your skill path."',
    actual: 'Line 122-123: hasCoach second branch. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-027',
    page: '/welcome (Welcome.tsx)',
    name: 'Subtitle: neither path nor coach → "Complete the Be:More flow..." text shown',
    pre: 'hasPersonalPath = false; hasCoach = false.',
    steps: '1. Load /welcome in this state.',
    expected: 'Subtitle: "Complete the Be:More flow to unlock your skill path."',
    actual: 'Line 124: else branch. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-028',
    page: '/welcome (UserHeader.tsx)',
    name: 'UserHeader showHomeLink=false hides "Home" nav link on Welcome page',
    pre: 'Welcome.tsx renders UserHeader.',
    steps: '1. Inspect nav on /welcome.',
    expected: '"Home" nav link NOT present in desktop or mobile nav.',
    actual: 'Welcome.tsx line 111: <UserHeader showHomeLink={false} />. UserHeader.tsx line 99: navLinks conditionally includes Home only if showHomeLink. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-029',
    page: '/welcome (UserHeader.tsx)',
    name: 'Community nav link opens in a new tab (target="_blank")',
    pre: 'Desktop viewport.',
    steps: '1. Inspect Community nav link.',
    expected: 'Anchor has target="_blank" and rel="noopener noreferrer".',
    actual: 'UserHeader.tsx lines 126-131: "href" in link branch renders <a target="_blank" rel="noopener noreferrer">. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-030',
    page: '/welcome (UserHeader.tsx)',
    name: 'Log out navigates to "/" (root) after sign out',
    pre: 'User is authenticated.',
    steps: '1. Click "Log out" in account dropdown.',
    expected: 'signOut() called, then navigate("/").',
    actual: 'UserHeader.tsx lines 80-83: handleLogOut awaits signOut() then navigate("/"). Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-031',
    page: '/welcome (UserHeader.tsx)',
    name: 'Account dropdown shows correct user email',
    pre: 'user.email = "test@example.com".',
    steps: '1. Open account dropdown.',
    expected: 'Email "test@example.com" shown in dropdown.',
    actual: 'UserHeader.tsx line 165: <p className="text-xs ... truncate">{user.email}</p>. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-032',
    page: '/welcome (UserHeader.tsx)',
    name: 'Mobile hamburger button opens the Sheet nav panel',
    pre: 'Viewport width < 768px (md breakpoint).',
    steps: '1. Click hamburger icon.',
    expected: 'Sheet opens; nav links visible.',
    actual: 'UserHeader.tsx lines 194-261: Sheet with open={mobileOpen} onOpenChange={setMobileOpen}. SheetTrigger toggles state. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-033',
    page: '/welcome (UserHeader.tsx)',
    name: 'Mobile nav link click closes the Sheet',
    pre: 'Mobile Sheet is open.',
    steps: '1. Click any nav link in mobile sheet.',
    expected: 'Sheet closes (setMobileOpen(false) called).',
    actual: 'UserHeader.tsx lines 235-240: Link onClick={() => setMobileOpen(false)}. Also href links at line 225. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-034',
    page: '/welcome (Welcome.tsx)',
    name: 'Error in loadData caught and logged — no uncaught exception',
    pre: 'Supabase query throws network error.',
    steps: '1. Load /welcome with mocked Supabase error.',
    expected: 'Error caught in catch block; logged via console.error; loadingData set to false.',
    actual: 'Lines 89-93: catch block logs error; finally sets setLoadingData(false). Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-035',
    page: '/welcome (Welcome.tsx)',
    name: 'Coach name defaults to "Your Coach" when coach_profiles.display_name is null',
    pre: 'coachProfile.display_name = null.',
    steps: '1. Load /welcome with coach who has no display_name.',
    expected: 'coachName state = "Your Coach".',
    actual: 'Line 87: setCoachName((coachProfile as any)?.display_name || "Your Coach"). Null/undefined triggers fallback. HOWEVER coachName is then used at line 247 as coachName[0].toUpperCase(). "Your Coach"[0] = "Y" — safe. But empty string "" would crash here. See BUG-H001.',
    status: 'Pass',
    priority: 'P1',
    bug: 'BUG-H001',
  },

  // ── SkillPath page ──────────────────────────────────────────────────────────
  {
    id: 'HP-036',
    page: '/path (SkillPath.tsx)',
    name: 'Auth redirect: unauthenticated user sent to /auth',
    pre: 'user = null, loading = false.',
    steps: '1. Navigate to /path while logged out.',
    expected: 'Redirect to /auth.',
    actual: 'SkillPath.tsx lines 39-42: same guard as Welcome.tsx. Correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-037',
    page: '/path (SkillPath.tsx)',
    name: 'No active path → empty state "Your Path Is on Its Way" shown',
    pre: 'personal_paths query returns no rows; pathData = null.',
    steps: '1. Navigate to /path with no path.',
    expected: 'Empty state with heading "Your Path Is on Its Way" and "Go to Dashboard" button.',
    actual: 'Lines 147-174: if (!pathData) returns empty state component. Correct.',
    status: 'Pass',
    priority: 'P0',
    bug: '',
  },
  {
    id: 'HP-038',
    page: '/path (SkillPath.tsx)',
    name: 'No path → "Go to Dashboard" button navigates to /welcome',
    pre: 'pathData = null; empty state rendered.',
    steps: '1. Click "Go to Dashboard" button.',
    expected: 'Navigate to /welcome.',
    actual: 'Line 164: onClick={() => navigate("/welcome")}. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-039',
    page: '/path (SkillPath.tsx)',
    name: 'Has path → progress badge shows correct total percentage',
    pre: 'Path with 4 tasks, 2 completed → totalProgress = 50.',
    steps: '1. Load /path.',
    expected: 'Badge reads "50% Complete".',
    actual: 'Lines 118-119: totalProgress computed from allTasks. Line 186: <Badge>{pathData.totalProgress}% Complete</Badge>. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-040',
    page: '/path (SkillPath.tsx)',
    name: 'Has path → phase count shown correctly',
    pre: 'Path has 3 phases.',
    steps: '1. Load /path.',
    expected: '"3 Phases" shown in header.',
    actual: 'Line 197: {pathData.phases.length} Phases. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-041',
    page: '/path (SkillPath.tsx)',
    name: 'Has path → total task count shown correctly',
    pre: 'Path phases sum to 8 tasks total.',
    steps: '1. Load /path.',
    expected: '"8 Tasks" shown in header.',
    actual: 'Line 199: {pathData.phases.reduce((sum, p) => sum + p.tasks.length, 0)} Tasks. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-042',
    page: '/path (SkillPath.tsx)',
    name: 'Phase locking: first phase (index 0) is never locked',
    pre: 'Path with 2 phases.',
    steps: '1. Load /path.',
    expected: 'Phase at index 0: isLocked = false.',
    actual: 'Line 262: isLocked = index > 0 && ...; index 0: 0 > 0 = false → isLocked = false. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-043',
    page: '/path (SkillPath.tsx)',
    name: 'Phase locking: phase 1 locked if phase 0 progress < 100',
    pre: 'Phase 0 progress = 60 (computed from tasks).',
    steps: '1. Load /path.',
    expected: 'Phase at index 1: isLocked = true.',
    actual: 'Line 262: index > 0 (true) && pathData.phases[0].progress < 100 (60 < 100 = true) → isLocked = true. NOTE: progress is client-computed from tasks in convertPersonalPathToSkillPath (line 87), not the DB total_progress field. Could differ from DB. See BUG-H006.',
    status: 'Pass',
    priority: 'P1',
    bug: 'BUG-H006',
  },
  {
    id: 'HP-044',
    page: '/path (SkillPath.tsx)',
    name: 'Phase locking: phase 1 unlocked when phase 0 progress = 100',
    pre: 'Phase 0 has 3 tasks all completed → progress = 100.',
    steps: '1. Load /path.',
    expected: 'Phase at index 1: isLocked = false.',
    actual: 'Line 262: 100 < 100 = false → isLocked = false. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-045',
    page: '/path (SkillPath.tsx)',
    name: "Today's Focus finds first task with status 'available' or 'in_progress'",
    pre: 'Phase 0 tasks: completed, available, in_progress. Phase 1 tasks: locked.',
    steps: '1. Load /path.',
    expected: "todaysFocus points to first 'available' task in phase 0.",
    actual: "Lines 104-113: iterates phases, finds first task where status === 'available' || status === 'in_progress'. Breaks on first match. Correct.",
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-046',
    page: '/path (SkillPath.tsx)',
    name: "Today's Focus hidden when path is 100% complete",
    pre: 'pathData.totalProgress = 100.',
    steps: '1. Load /path at 100%.',
    expected: "Today's Focus component NOT rendered.",
    actual: "Line 255: {pathData.todaysFocus && pathData.totalProgress < 100 && <TodayFocus ... />}. 100 < 100 = false hides it. Correct.",
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-047',
    page: '/path (SkillPath.tsx)',
    name: '"Continue Path" header button navigates to /path/task/:taskId with phaseId state',
    pre: 'todaysFocus = { taskId: "t1", phaseId: "p1" }.',
    steps: '1. Click "Continue Path" header button.',
    expected: 'navigate("/path/task/t1", { state: { phaseId: "p1" } }).',
    actual: 'Lines 131-135: handleTodayFocusClick navigates to /path/task/${taskId} with state. Line 205-212: Continue Path button calls handleTodayFocusClick. BUT: "Continue Path" button is ONLY rendered when pathData.todaysFocus is truthy (line 204). When path is 100%, todaysFocus may be null — button disappears. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-048',
    page: '/path (PhaseCard.tsx)',
    name: 'Phase card "View Phase" button navigates to /path/phase/:phaseId',
    pre: 'Phase is not locked and not complete.',
    steps: '1. Click "View Phase" button on a phase card.',
    expected: 'Navigate to /path/phase/{phase.id}.',
    actual: 'PhaseCard.tsx line 97: onClick={() => navigate(`/path/phase/${phase.id}`)}. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-049',
    page: '/path (PhaseCard.tsx)',
    name: 'Phase card locked → button disabled and shows "Complete Previous Phase"',
    pre: 'isLocked = true.',
    steps: '1. View a locked phase card.',
    expected: 'Button has disabled attribute. Text reads "Complete Previous Phase".',
    actual: 'PhaseCard.tsx line 94: disabled={isLocked}. Line 99-103: isLocked → "Complete Previous Phase" label. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-050',
    page: '/path (SkillPath.tsx)',
    name: 'Path 100% complete → Trophy completion banner shown',
    pre: 'pathData.totalProgress = 100.',
    steps: '1. Load /path.',
    expected: 'Trophy banner with "Congratulations!" heading visible.',
    actual: 'Lines 227-252: {pathData.totalProgress === 100 && (<div ... Trophy banner>)}. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-051',
    page: '/path (SkillPath.tsx)',
    name: 'Trophy banner "View Growth Plan" button navigates to /success-growth',
    pre: 'pathData.totalProgress = 100; Trophy banner visible.',
    steps: '1. Click "View Growth Plan" button.',
    expected: 'Navigate to /success-growth.',
    actual: 'Line 242: onClick={() => navigate("/success-growth")}. Route exists in App.tsx line 144. Correct.',
    status: 'Pass',
    priority: 'P1',
    bug: '',
  },
  {
    id: 'HP-052',
    page: '/path (TodayFocus.tsx)',
    name: 'TodayFocus returns null if todaysFocus is undefined',
    pre: 'pathData.todaysFocus = undefined.',
    steps: '1. Load /path with no focus task.',
    expected: 'TodayFocus component renders nothing.',
    actual: 'TodayFocus.tsx line 11: if (!pathData.todaysFocus) return null. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-053',
    page: '/path (SkillPath.tsx)',
    name: 'Phase progress computed client-side from completed tasks / total tasks',
    pre: 'Phase has 4 tasks: 2 completed, 2 available.',
    steps: '1. Load /path.',
    expected: 'Phase progress = 50%.',
    actual: 'Lines 86-87: completedTasks filtered by status === "completed". progress = Math.round(completedTasks / tasks.length * 100). 2/4*100 = 50. Correct.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },

  // ── Additional edge cases ──────────────────────────────────────────────────
  {
    id: 'HP-054',
    page: '/welcome (Welcome.tsx)',
    name: 'CONFLICT: path_committed=false AND has personal path — both "Not Committed" card AND path card show simultaneously',
    pre: 'hasPersonalPath = true AND profile.path_committed = false (inconsistent DB state).',
    steps: '1. Load /welcome with this contradictory state.',
    expected: 'Only one card should show; UI should not display conflicting cards.',
    actual: 'FAIL: Line 143: {hasPersonalPath && ...path card}. Line 174: {!profile?.path_committed && ...not-committed card}. These conditions are independent — both render simultaneously when hasPersonalPath=true AND path_committed=false. No mutual exclusion guard.',
    status: 'Fail',
    priority: 'P2',
    bug: 'BUG-H002',
  },
  {
    id: 'HP-055',
    page: '/welcome (Welcome.tsx)',
    name: 'coachName is empty string "" — avatar initial crashes with index on empty string',
    pre: 'DB returns display_name = "" (empty string).',
    steps: '1. Load /welcome with coach whose display_name is an empty string.',
    expected: 'Should handle gracefully — show fallback or "Your Coach".',
    actual: 'FAIL: Line 87: setCoachName("" || "Your Coach") — empty string is falsy! So "" || "Your Coach" = "Your Coach". Actually SAFE: empty string is falsy, fallback activates. Re-evaluated to Pass.',
    status: 'Pass',
    priority: 'P2',
    bug: '',
  },
  {
    id: 'HP-056',
    page: '/path (SkillPath.tsx)',
    name: 'SkillPath loadPath useEffect does not guard on loading=true — may fire before auth resolves',
    pre: 'user is set but loading is still true.',
    steps: '1. Component mounts; auth loading in progress.',
    expected: 'loadPath should wait for auth to fully resolve.',
    actual: 'FAIL: SkillPath.tsx line 70: if (user) loadPath() — this effect depends only on [user], not [user, loading]. If user is available but loading is still true (edge case during token refresh), loadPath fires prematurely. Welcome.tsx correctly guards with if (!loading && user). SkillPath.tsx has a mismatch.',
    status: 'Fail',
    priority: 'P2',
    bug: 'BUG-H003',
  },
];

// ─── Sheet 5 data: Issues Log ─────────────────────────────────────────────────

const ISSUE_HEADERS = [
  'Issue_ID', 'Severity', 'Page', 'Issue Title',
  'Description', 'Code Reference (file:line)', 'Impact', 'Recommended Fix',
];

const issues = [
  {
    id: 'BUG-H001',
    severity: 'Medium',
    page: 'Welcome.tsx',
    title: 'coachName[0].toUpperCase() would crash if coachName is somehow empty string',
    description: 'Line 247 accesses coachName[0] to render the avatar initial. The fallback at line 87 uses || "Your Coach" which correctly catches null/undefined, and empty string is also falsy so it also falls through to "Your Coach". However, the coach card guard at line 243 is {coachName && ...} which evaluates true for any non-empty string. If coachName were ever an empty string somehow (e.g., set via other code paths), coachName[0] on an empty string returns undefined, and .toUpperCase() would throw TypeError. Currently the || fallback prevents this, but the code is fragile.',
    ref: 'Welcome.tsx line 87: setCoachName(... || "Your Coach"); line 243: {coachName && ...}; line 247: {coachName[0].toUpperCase()}',
    impact: 'Low risk currently due to fallback, but a future code change removing the fallback or setting coachName directly could cause a crash in the avatar render.',
    fix: 'Replace coachName[0].toUpperCase() with (coachName || "?")[0].toUpperCase() as a defensive guard, or add an explicit non-empty check.',
  },
  {
    id: 'BUG-H002',
    severity: 'Medium',
    page: 'Welcome.tsx',
    title: 'Conflicting cards can both render simultaneously when DB state is inconsistent',
    description: 'The personal path card (hasPersonalPath) and the "Not Committed" card (!profile?.path_committed) are rendered with independent conditions. There is no mutual exclusion between them. In the edge case where a user has a personal_paths row (hasPersonalPath=true) but profile.path_committed=false — possible during DB inconsistency or data migration — both cards render at the same time on the same page. Similarly, the "Coach Building Path" card and the "Path Coming Soon" card can both be rendered alongside the personal path card.',
    ref: 'Welcome.tsx line 143 (hasPersonalPath check), line 174 (!profile?.path_committed check), line 197, line 224. No else-if chaining.',
    impact: 'User sees confusing duplicate/conflicting UI states. Page layout breaks with multiple overlapping action cards.',
    fix: 'Refactor card rendering to use an if/else-if chain or a single discriminated union state variable that determines exactly which card to show. Priority: path card > coach-building card > path-coming-soon card > not-committed card.',
  },
  {
    id: 'BUG-H003',
    severity: 'Medium',
    page: 'SkillPath.tsx',
    title: 'loadPath useEffect does not guard on loading=true — premature DB query during auth resolution',
    description: 'SkillPath.tsx line 70: the data-loading useEffect has dependency [user] only. It fires whenever user changes. If user becomes truthy before loading transitions to false (possible during token refresh), loadPath fires with a partially-initialised auth context. Welcome.tsx correctly guards: if (!loading && user) loadData(). SkillPath.tsx uses only if (user).',
    ref: 'SkillPath.tsx line 70: if (user) loadPath(). Compare Welcome.tsx line 96: if (!loading && user) loadData().',
    impact: 'Potential race condition: DB query fires before auth context fully resolves. Could result in a path being fetched with a stale token, failing silently and leaving the user on the empty-state screen even though a path exists.',
    fix: 'Change dependency array to [user, loading] and guard: if (!loading && user) loadPath(). Matches the pattern in Welcome.tsx.',
  },
  {
    id: 'BUG-H004',
    severity: 'Low',
    page: 'Welcome.tsx',
    title: 'Progress bar uses DB total_progress field which may be stale relative to task completion',
    description: 'Welcome.tsx line 77 sets pathProgress = pathRes.data.total_progress directly from the DB field. SkillPath.tsx recalculates totalProgress client-side from tasks (line 118-119). If total_progress in the DB is not updated when tasks are completed (e.g., via a trigger or explicit update), the Welcome page progress bar could show a stale value while the SkillPath page shows the correct computed value.',
    ref: 'Welcome.tsx line 77: setPathProgress(pathRes.data.total_progress). SkillPath.tsx lines 116-119: client-computed totalProgress from allTasks.',
    impact: 'Welcome page progress bar may show incorrect progress (stale DB value). User could see 0% on Welcome but 50% on SkillPath for the same path.',
    fix: 'Ensure total_progress is updated via a DB trigger whenever task status changes, or compute progress on the Welcome page similarly to SkillPath.tsx (requires fetching phases JSON).',
  },
  {
    id: 'BUG-H005',
    severity: 'Low',
    page: 'UserHeader.tsx',
    title: 'formatLastActive reads from step1_assessments table — may not reflect actual last activity',
    description: 'UserHeader.tsx line 63-69 queries step1_assessments.updated_at for the "Last active" date in the account dropdown. This only reflects the last time the step1 assessment was modified. Users who have completed the step1 assessment long ago but have been active in skill path tasks, coach messaging, or other pages will see an outdated "last active" date.',
    ref: 'UserHeader.tsx lines 63-69: supabase.from("step1_assessments").select("updated_at"). Line 92: formatLastActive(stats.lastActive).',
    impact: 'Inaccurate "Last active" display. Minor UX inconsistency — does not affect functionality.',
    fix: 'Consider querying a dedicated user_activity or profiles table with a last_seen_at field, or use the maximum updated_at across multiple relevant tables.',
  },
  {
    id: 'BUG-H006',
    severity: 'Low',
    page: 'SkillPath.tsx',
    title: 'Phase locking uses client-computed progress, but progress could diverge from DB if tasks lack status field',
    description: 'SkillPath.tsx line 262 checks pathData.phases[index-1].progress < 100 for locking. This progress value is computed client-side in convertPersonalPathToSkillPath() by counting tasks with status === "completed" (line 86-87). If a task object in the DB phases JSON does not have a status field, line 81 defaults it to "locked". A task stuck as "locked" can never be counted as completed, meaning phase progress is always < 100, meaning subsequent phases are always locked — even if the intended state is "unlocked".',
    ref: 'SkillPath.tsx line 81: status: task.status || "locked". Line 86: tasks.filter(t => t.status === "completed"). Line 262: isLocked = index > 0 && pathData.phases[index - 1].progress < 100.',
    impact: 'If tasks are added to DB without an explicit status field, all subsequent phases will be permanently locked. Users cannot progress past phase 1.',
    fix: 'Default task status to "available" (not "locked") when the field is absent, or validate that all tasks in the DB have explicit status values. Alternatively, add a console warning when tasks without status are detected.',
  },
  {
    id: 'BUG-H007',
    severity: 'Low',
    page: 'Welcome.tsx',
    title: 'coachAppPending check does not handle appRes.error — silent failure hides error state',
    description: 'Welcome.tsx line 70: (appRes.data as any)?.status === "pending". If appRes.error is set and appRes.data is null (Supabase error), the check safely evaluates to false and coachAppPending remains false. This is technically correct behavior (banner not shown on error), but no error is logged for the appRes failure case. The pathRes and assignmentRes errors are also not explicitly checked — only pathRes.data, assignmentRes.data are checked, with errors silently ignored.',
    ref: 'Welcome.tsx lines 70-88: only .data properties checked; no if (pathRes.error || assignmentRes.error || appRes.error) guard.',
    impact: 'Silent failures: if any of the three Supabase queries fail, the page renders as if the user has no path, no coach, and no pending application — without any error message to the user.',
    fix: 'Add error checks for all three responses. Consider showing a toast or inline error message when data cannot be loaded.',
  },
  {
    id: 'BUG-H008',
    severity: 'Low',
    page: 'Welcome.tsx / App.tsx',
    title: '/welcome wrapped in RequireStep which may gate access independently of Welcome.tsx auth guard',
    description: 'App.tsx line 112: <Route path="/welcome" element={<RequireStep><Welcome /></RequireStep>}>. RequireStep adds an additional step-gating layer on top of Welcome.tsx own auth useEffect guard. If RequireStep has stricter requirements (e.g., requires a completed step1 assessment), users who completed the Aura flow but skipped the old step1 flow may be redirected away from /welcome even though they should be allowed in.',
    ref: 'App.tsx line 112. Welcome.tsx lines 35-38. RequireStep component (not reviewed — file not in scope).',
    impact: 'Blocked: cannot fully determine without reading RequireStep. Potential scenario where valid users are incorrectly gated.',
    fix: 'Review RequireStep to confirm it does not conflict with the Aura-flow-based access to /welcome. If RequireStep uses old step1 flow gating, it should be updated or bypassed for Aura-flow users.',
  },
];

// ─── Build Sheet 4 ────────────────────────────────────────────────────────────

function makeSheet4(wb) {
  const ws = XLSX.utils.aoa_to_sheet([TC_HEADERS]);

  const R = (row, col) => XLSX.utils.encode_cell({ r: row, c: col });

  TC_HEADERS.forEach((h, ci) => {
    const addr = R(0, ci);
    if (!ws[addr]) ws[addr] = { v: h, t: 's' };
    ws[addr].s = headerStyle('1A5276');
  });

  testCases.forEach((tc, ri) => {
    const row = [
      tc.id, tc.page, tc.name, tc.pre,
      tc.steps, tc.expected, tc.actual, tc.status, tc.priority, tc.bug,
    ];
    row.forEach((val, ci) => {
      const addr = R(ri + 1, ci);
      ws[addr] = { v: val ?? '', t: 's' };

      let fill = undefined;
      if (ci === 7) fill = STATUS_FILL[tc.status];
      if (ci === 8) fill = PRIORITY_FILL[tc.priority];

      ws[addr].s = {
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

  ws['!cols'] = [
    { wch: 10 }, // TC_ID
    { wch: 28 }, // Page
    { wch: 48 }, // Test Name
    { wch: 32 }, // Preconditions
    { wch: 38 }, // Test Steps
    { wch: 40 }, // Expected Result
    { wch: 55 }, // Actual Result
    { wch: 12 }, // Status
    { wch: 10 }, // Priority
    { wch: 12 }, // Bug_ID
  ];

  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!ref'] = XLSX.utils.encode_range(
    { r: 0, c: 0 },
    { r: testCases.length, c: TC_HEADERS.length - 1 },
  );

  XLSX.utils.book_append_sheet(wb, ws, 'Home Page Test Cases');
}

// ─── Build Sheet 5 ────────────────────────────────────────────────────────────

function makeSheet5(wb) {
  const ws = XLSX.utils.aoa_to_sheet([ISSUE_HEADERS]);

  ISSUE_HEADERS.forEach((h, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) ws[addr] = { v: h, t: 's' };
    ws[addr].s = headerStyle('7B2D00');
  });

  issues.forEach((iss, ri) => {
    const row = [
      iss.id, iss.severity, iss.page, iss.title,
      iss.description, iss.ref, iss.impact, iss.fix,
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
    { wch: 18 }, // Page
    { wch: 52 }, // Title
    { wch: 65 }, // Description
    { wch: 45 }, // Code Reference
    { wch: 40 }, // Impact
    { wch: 45 }, // Recommended Fix
  ];

  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!ref'] = XLSX.utils.encode_range(
    { r: 0, c: 0 },
    { r: issues.length, c: ISSUE_HEADERS.length - 1 },
  );

  XLSX.utils.book_append_sheet(wb, ws, 'Home Page Issues');
}

// ─── Main: read existing workbook, append sheets, write back ─────────────────

console.log(`Reading existing workbook: ${FILE_PATH}`);
const wb = XLSX.readFile(FILE_PATH);

console.log(`Existing sheets: ${wb.SheetNames.join(', ')}`);

// Remove old sheets with same names if they exist (idempotent re-run)
['Home Page Test Cases', 'Home Page Issues'].forEach(name => {
  const idx = wb.SheetNames.indexOf(name);
  if (idx !== -1) {
    wb.SheetNames.splice(idx, 1);
    delete wb.Sheets[name];
    console.log(`Removed existing sheet: ${name}`);
  }
});

makeSheet4(wb);
makeSheet5(wb);

XLSX.writeFile(wb, FILE_PATH, { bookType: 'xlsx', cellStyles: true });

const failCount   = testCases.filter(tc => tc.status === 'Fail').length;
const passCount   = testCases.filter(tc => tc.status === 'Pass').length;
const blockedCount = testCases.filter(tc => tc.status === 'Blocked').length;
const p0Count     = testCases.filter(tc => tc.priority === 'P0').length;
const p1Count     = testCases.filter(tc => tc.priority === 'P1').length;
const medIssues   = issues.filter(i => i.severity === 'Medium').length;
const lowIssues   = issues.filter(i => i.severity === 'Low').length;

console.log(`\nHome Page Test Report — DONE`);
console.log(`Output: ${FILE_PATH}`);
console.log(`\nSheet 4 — Home Page Test Cases:`);
console.log(`  Total test cases : ${testCases.length}`);
console.log(`  Pass             : ${passCount}`);
console.log(`  Fail             : ${failCount}`);
console.log(`  Blocked          : ${blockedCount}`);
console.log(`  P0 cases         : ${p0Count}`);
console.log(`  P1 cases         : ${p1Count}`);
console.log(`\nSheet 5 — Home Page Issues:`);
console.log(`  Total bugs found : ${issues.length}`);
console.log(`  Medium severity  : ${medIssues}`);
console.log(`  Low severity     : ${lowIssues}`);
console.log(`\nFailed test cases:`);
testCases.filter(tc => tc.status === 'Fail').forEach(tc => {
  console.log(`  ${tc.id} [${tc.priority}] ${tc.name} → ${tc.bug || 'no bug ID'}`);
});
