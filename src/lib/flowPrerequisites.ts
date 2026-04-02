// Flow prerequisite system — single source of truth for route access gating
// Each route defines what progress flags must be true before access is allowed.
// be:more Flow: Onboarding → Initial Personality → Challenges → Wheel of Life → Blob Tree → Value Map → Reality → Options → Will

export interface FlowProgress {
  onboarding_complete: boolean;
  step1_completed: boolean;
  challenges_complete: boolean;
  wheel_of_life_complete: boolean;
  blob_tree_complete: boolean;
  value_map_complete: boolean;
  reality_report_generated: boolean;
  path_options_shown: boolean;
  path_committed: boolean;
  personal_path_generated: boolean;
}

export const defaultFlowProgress: FlowProgress = {
  onboarding_complete: false,
  step1_completed: false,
  challenges_complete: false,
  wheel_of_life_complete: false,
  blob_tree_complete: false,
  value_map_complete: false,
  reality_report_generated: false,
  path_options_shown: false,
  path_committed: false,
  personal_path_generated: false,
};

// Ordered flow steps — each entry maps a route prefix to its required flags
const FLOW_STEPS: { route: string; requires: (keyof FlowProgress)[]; label: string }[] = [
  { route: '/onboarding', requires: [], label: 'Onboarding' },
  { route: '/initial-assessment', requires: ['onboarding_complete'], label: 'Initial Personality Hypothesis' },
  { route: '/initial-results', requires: ['onboarding_complete'], label: 'Initial Personality Results' },
  { route: '/goals-reality', requires: ['step1_completed'], label: 'Current Challenges & Barriers' },
  { route: '/assessment/wheel-of-life', requires: ['challenges_complete'], label: 'Wheel of Life Assessment' },
  { route: '/assessment/blob-tree', requires: ['wheel_of_life_complete'], label: 'Blob Tree Assessment' },
  { route: '/assessment/value-map', requires: ['blob_tree_complete'], label: 'Value Map Assessment' },
  { route: '/reality', requires: ['blob_tree_complete', 'value_map_complete'], label: 'Reality Report' },
  { route: '/path-options', requires: ['reality_report_generated'], label: 'Path Options' },
  { route: '/commit', requires: ['path_options_shown'], label: 'Commitment' },
  { route: '/welcome', requires: ['path_committed'], label: 'Dashboard' },
  { route: '/path', requires: ['personal_path_generated'], label: 'Personal Path' },
];

// Map a flag to the route that fulfills it
const FLAG_TO_ROUTE: Record<keyof FlowProgress, string> = {
  onboarding_complete: '/onboarding',
  step1_completed: '/initial-assessment',
  challenges_complete: '/goals-reality',
  wheel_of_life_complete: '/assessment/wheel-of-life',
  blob_tree_complete: '/assessment/blob-tree',
  value_map_complete: '/assessment/value-map',
  reality_report_generated: '/reality',
  path_options_shown: '/path-options',
  path_committed: '/commit',
  personal_path_generated: '/path',
};

const FLAG_TO_LABEL: Record<keyof FlowProgress, string> = {
  onboarding_complete: 'Onboarding',
  step1_completed: 'Initial Personality Hypothesis',
  challenges_complete: 'Current Challenges & Barriers',
  wheel_of_life_complete: 'Wheel of Life Assessment',
  blob_tree_complete: 'Blob Tree Assessment',
  value_map_complete: 'Value Map Assessment',
  reality_report_generated: 'Reality Report',
  path_options_shown: 'Path Options',
  path_committed: 'Commitment',
  personal_path_generated: 'Personal Path',
};

export interface PrerequisiteCheck {
  allowed: boolean;
  missingSteps: { flag: keyof FlowProgress; route: string; label: string }[];
  redirectTo: string | null;
  bannerMessage: string | null;
}

/**
 * Check if a user can access a given route based on their flow progress.
 * Returns the earliest missing step to redirect to if not allowed.
 */
export function checkPrerequisites(
  targetRoute: string,
  progress: FlowProgress
): PrerequisiteCheck {
  // Find matching flow step
  const step = FLOW_STEPS.find(s => targetRoute.startsWith(s.route));

  // Routes not in the flow are always allowed (e.g. /, /auth, /account)
  if (!step) {
    return { allowed: true, missingSteps: [], redirectTo: null, bannerMessage: null };
  }

  const missing = step.requires.filter(flag => !progress[flag]);

  if (missing.length === 0) {
    return { allowed: true, missingSteps: [], redirectTo: null, bannerMessage: null };
  }

  const missingSteps = missing.map(flag => ({
    flag,
    route: FLAG_TO_ROUTE[flag],
    label: FLAG_TO_LABEL[flag],
  }));

  // Redirect to the earliest missing step
  const redirectTo = missingSteps[0].route;
  const bannerMessage = `To continue, complete ${missingSteps[0].label}.`;

  return { allowed: false, missingSteps, redirectTo, bannerMessage };
}

/**
 * Get the next step the user should take based on their current progress.
 * Used to guide users forward in the flow.
 */
export function getNextRequiredRoute(progress: FlowProgress): string | null {
  if (!progress.onboarding_complete) return '/onboarding';
  if (!progress.step1_completed) return '/initial-assessment';
  if (!progress.challenges_complete) return '/goals-reality';
  if (!progress.wheel_of_life_complete) return '/assessment/wheel-of-life';
  if (!progress.blob_tree_complete) return '/assessment/blob-tree';
  if (!progress.value_map_complete) return '/assessment/value-map';
  if (!progress.reality_report_generated) return '/reality';
  if (!progress.path_options_shown) return '/path-options';
  if (!progress.path_committed) return '/commit';
  if (!progress.personal_path_generated) return '/welcome';
  return null; // All steps complete
}
