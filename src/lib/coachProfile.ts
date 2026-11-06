// The one Be:More coach every user is pointed to.
// PLACEHOLDER COPY: edit the fields below to change how the coach is described
// across the app (Aura's Paths + Commit steps and the My Coach page).
// The coach's login account is marked in the database with coach_profiles.is_primary = true
// (see supabase/migrations/20261105120000_single_coach.sql).

export interface CoachProfile {
  name: string;
  /** Short role line under the name. */
  title: string;
  /** Two or three sentences: who they are. */
  bio: string;
  /** What they help with, shown as bullets. */
  helpsWith: string[];
  /** How a coaching relationship works with them. */
  approach: string;
  /** When users can expect replies. */
  availability: string;
}

export const PRIMARY_COACH: CoachProfile = {
  name: 'Sam',
  title: 'Be:More Head Coach',
  bio: 'Sam has spent over ten years helping people turn “one day” goals into plans they actually finish. That covers career changes, fitness milestones, money goals, learning new skills and big life moves. Sam is a certified coach who believes small, steady weekly steps beat big bursts of motivation.',
  helpsWith: [
    'Turning a vague goal into a clear finish line',
    'Building a weekly plan that fits around real life',
    'Getting unstuck when motivation or confidence dips',
    'Adjusting your path as things change',
  ],
  approach: 'Your path gets a weekly review, check-ins by message and adjustments made together with you. It’s honest and practical, with no judgement.',
  availability: 'Replies within one working day, Monday to Friday.',
};
