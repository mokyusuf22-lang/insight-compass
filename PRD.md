# Be:More — Product Requirements Document
**Version 1.1 | September 2026**

---

## 1. Product Overview

**Be:More** is an AI-powered personal development platform. A user picks any goal (from a catalogue of 1,200+ or in their own words), answers a few quick questions, and gets an honest "reality report" plus a step-by-step, location-aware plan. They follow the plan on their own with Aura (the AI coach) or with a human coach. Optional deep-dive assessments sharpen the picture afterwards.

| Part | Purpose |
|---|---|
| **Aura onboarding** (`/aura`) | Goal → about you (incl. location) → Aura's themes → 3 quick check-ins → reality report → 3 path options → commit |
| **Dashboard + skill path** (`/welcome`, `/path`) | Weekly tasks and progress; each task says where/how to do it in the user's country |
| **Deep-dive assessments** | DISC, Wheel of Life, Blob Tree, Values, Strengths — taken after onboarding, recommended from the user's themes |
| **Coaching** | Users who choose a human coach are auto-matched; coach and client message in real time |

Everything is free. The earlier Stripe paywall, the old gated "Be:More structured flow" and the MBTI/Step 1 assessments were removed in September 2026.

---

## 2. User Roles

| Role | Description |
|---|---|
| `user` | Default. Sets a goal with Aura, follows a skill path, takes deep-dives, can message an assigned coach |
| `coach` | Human coach. Sees assigned clients (goal, location, answers, report, path, assessments), messages them, edits their skill paths |
| `admin` | Full access. Approves coach applications, matches clients to coaches, sets coach capacity, views platform stats |

Roles live in `user_roles` and are read via the `get_my_roles()` RPC. A user can hold several roles. Coaches and admins land on `/coach` after sign-in.

---

## 3. System Architecture

### 3.1 Stack

```
Frontend:   React 18 + TypeScript + Vite
Styling:    Tailwind CSS + shadcn-ui (Aura flow uses its own bm-* palette, Instrument Serif + Manrope)
Routing:    React Router v6
State:      React Context (auth) + TanStack Query + localStorage (Aura draft)
Backend:    Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Row Level Security)
AI:         Claude API (Anthropic) via the aura-plan and generate-coaching edge functions
```

### 3.2 High-Level Architecture

```
Browser (React SPA)
  ├── Supabase Auth (email/password, Google)
  ├── Supabase Database (PostgreSQL + RLS)
  │     ├── goals                ← 1,200+ goal catalogue, search_goals() RPC
  │     ├── aura_sessions        ← Aura flow state (flow_data), themes, summary
  │     ├── personal_paths       ← skill path (phases → tasks with where/costNote)
  │     ├── reality_reports, path_recommendations, path_commitments
  │     ├── *_assessments        ← deep-dive results
  │     ├── coach_*              ← profiles, assignments, messages, applications, requests
  │     └── user_roles
  ├── Supabase Realtime          ← coach_messages
  └── Edge Functions
        ├── aura-plan            ← themes (Claude Haiku 4.5) and location-aware plan (Claude Sonnet 5)
        └── generate-coaching    ← task-page Q&A
```

### 3.3 Data Flow

```
User picks a goal (search_goals) and answers About you (incl. country/town)
        ↓
aura-plan mode "themes" → 3 themes shown on the Aura step
        ↓
3 check-ins (life balance, working style, values)
        ↓
aura-plan mode "plan" → 3 phases × 3–4 tasks, each with where/how for the user's country
        ↓
User picks a path and commits
  → personal_paths, reality_reports, path_recommendations, path_commitments written
  → profile flags set; if "with a human coach": request_coach() auto-matches or queues
        ↓
/welcome dashboard → /path; deep-dive assessments recommended from themes
```

AI outputs are cached in `aura_sessions.flow_data` keyed by their inputs, so reloads don't repeat AI calls. If AI is unavailable the flow falls back to generic themes and a general plan.

---

## 4. Feature Requirements

### 4.1 Aura Onboarding (`/aura`, 7 steps)

| Step | What happens |
|---|---|
| Welcome | First name |
| 1 Your goal | Debounced server search over the goal catalogue (typo-tolerant); "use my own words" for anything else |
| 2 About you | Country (required), town (optional), level, timeline, weekly hours, obstacles |
| 3 Aura | Summary of what the user said + 3 AI themes |
| 4 Check-ins | Life balance (6 areas, 1–5), working style (4 styles), values (up to 3) |
| 5 Insights | Reality report: summary, what's working, watch-outs, what drives you; "does this sound like you?" |
| 6 Your path | Steady / Focused sprint / Coach-guided (one recommended); "First steps" preview with location guidance |
| 7 Commit | Start date, self-directed vs human coach, optional pledge |

- Requires sign-in. Progress saves to localStorage immediately and to `aura_sessions.flow_data` (debounced); resumable across devices.
- `current_step` runs 0–7 during the flow and is 8 once committed; a committed user visiting `/aura` goes to `/welcome`. `/aura?new=1` starts a new goal.
- Location rules for AI plans: use the country's real official bodies and processes, say how to find local providers, never name private businesses, give costs only as rough local-currency ranges.

### 4.2 Dashboard (`/welcome`)

- Active skill path card, coach card (or "you're in the queue"), coach-application banner.
- **Go deeper**: the five deep-dive assessments, recommended ones first, completed ones last.
- Users without a committed path see "Set your goal with Aura".

### 4.3 Assessments

| Assessment | Table | Output |
|---|---|---|
| DISC | `disc_assessments` | `D/I/S/C` scores, `primaryStyle`, summary |
| Strengths | `strengths_assessments` | `ranked_strengths[]` |
| Value Map | `value_map_assessments` | `top_five`, `ranked_values` (value ids) |
| Wheel of Life | `wheel_of_life_assessments` | `scores` (8 domains, 0–10) |
| Blob Tree | `blob_tree_assessments` | `current_blob`, `desired_blob` |

All are free and support resume. Completion sets the matching profile flag; results pages link back to the dashboard.

### 4.4 Coaching

- **Matching:** choosing "With a human coach" calls `request_coach()`: assigns the approved coach with the fewest active clients under their `max_clients`; if none has room, the user joins the `coach_requests` queue.
- **Admin (`/admin/coaching`):** queue of waiting clients, coach capacity (editable), active matches with reassign/end.
- **Coach portal (`/coach`):** client list with goal, location, path %, assessments done, live unread badges; client profile with the Aura brief, reality report, assessments and path; path builder that keeps the client's completed tasks and posts a message when the path changes.
- **Messaging:** one thread per assignment (`coach_messages.assignment_id`), realtime, de-duplicated, read receipts marked by the recipient; unread badge in the header ("My coach").
- **Coach application:** `/become-a-coach` → admin approves in `/admin/coach-applications` (grants role + coach profile).

### 4.5 Skill Path Execution

`personal_paths.phases` (JSONB): ordered phases, each with tasks `{ id, title, description, where, costNote, instructions[], successCriteria, estimatedMinutes, status }`. Pages: `/path`, `/path/phase/:id`, `/path/task/:id` (shows a "Where to do this" block). Completing the path offers "Set a new goal".

---

## 5. Data Model (key tables)

**`profiles`** — `user_id`, `email`, assessment flags (`disc_completed`, `strengths_completed`, `value_map_complete`, `wheel_of_life_complete`, `blob_tree_complete`), path flags (`path_committed`, `personal_path_generated`, `reality_report_generated`, `path_options_shown`). Legacy columns (`has_paid`, old-flow flags) remain but are unused.

**`goals`** — `id` (slug), `label`, `category`, `keywords`, `popularity`, generated `search` tsvector. Seeded from `supabase/seed/goals/*.json` via `npm run build:goals`.

**`aura_sessions`** — `name`, `challenge_text` (goal), `identified_themes`, `aura_summary`, `current_step`, `user_confirmed`, `flow_data` (full Aura state incl. location and cached plan).

**Coaching** — `coach_profiles` (+ `max_clients`), `coach_assignments` (unique coach/user, status active/paused/ended, `is_demo`), `coach_messages` (`assignment_id`, `sender_id`, `content`, `is_read`), `coach_applications`, `coach_requests` (queue).

**Paths** — `personal_paths`, `reality_reports`, `path_recommendations`, `path_commitments`.

Legacy tables kept for their data but no longer used by the app: `assessments`, `step1_assessments`, `mbti_assessments`, `career_strategies`, `weekly_execution_plans`.

---

## 6. Security & Access Control

- RLS on every table. Users read/write their own rows.
- Coaches read their active clients' rows via `is_coach_of(user_id)` (profiles, aura_sessions, assessments, reports, commitments) and can edit their paths.
- Admins read everything via `is_admin()`; admin actions go through security-definer RPCs (`admin_assign_coach`, `admin_end_assignment`, `admin_set_max_clients`, `admin_coaching_overview`).
- Route guards: `RequireRole` (signed-in; optionally `coach`/`admin`) on `/welcome`, `/path*`, `/coach*`, `/admin/*`.
- AI keys live only in edge-function secrets; `aura-plan` verifies the user's JWT.

---

## 7. AI Integration

**`aura-plan`** (POST, signed-in users only)
- `mode: "themes"` → `{ summary, themes: [{ area, confidence, why }] }` — Claude Haiku 4.5.
- `mode: "plan"` → `{ phases: [{ title, tasks: [{ title, description, where, instructions[], successCriteria, estimatedMinutes, costNote }] }] }` — Claude Sonnet 5, medium effort.
- Structured outputs (JSON schema) plus server-side clean-up; refusals and errors return a status the app falls back from.

**`generate-coaching`** — answers questions on the task page. Known issue: it expects different input fields than `TaskPage` sends.

---

## 8. Payments

None. All features are free. (Stripe checkout, subscriptions and the Strengths paywall were removed in September 2026; Stripe secrets on the Supabase project were left untouched.)

---

## 9. Key UX Decisions

| Decision | Rationale |
|---|---|
| Goal first, assessments later | Users get a plan in ~5 minutes; deep-dives are optional refinement |
| Server-side goal search | 1,200+ goals without shipping them all to the browser; typo-tolerant |
| Location-aware tasks without naming businesses | Useful ("where do I book lessons?") without stale or invented listings |
| AI results cached by inputs | No repeat AI calls on reload or Back |
| Auto-matching with an admin queue | Clients get a coach immediately when capacity exists |
| One thread per assignment | Reassigning a coach starts a fresh conversation; history is kept |

---

## 10. Known Gaps & Future Work

| Area | Gap |
|---|---|
| Notifications | In-app only (unread badges); no email/push for messages, matches or path updates |
| `generate-coaching` | Input mismatch with `TaskPage` — the task Q&A probably doesn't work |
| Reality report | Templated from answers; deep-dive results don't update it yet |
| Migration history | The live database has no recorded migration history; apply new migrations with `supabase db query --linked -f <file>` (not `db push`) |
| Analytics | No event tracking |
| i18n | Copy is English-only |

---

## 11. Route Index

| Route | Page | Access |
|---|---|---|
| `/` | Index (landing) | Public |
| `/auth` | Auth | Public |
| `/aura` (`/aura/*` → `/aura`) | AuraFlow | Signed in |
| `/welcome` | Welcome (dashboard) | Signed in |
| `/path`, `/path/phase/:id`, `/path/task/:id` | SkillPath, PhasePage, TaskPage | Signed in |
| `/results` | Results | Signed in |
| `/account` | Account | Signed in |
| `/assessment/{disc,strengths,wheel-of-life,blob-tree,value-map}` (+ `/results`) | Deep-dive assessments | Signed in |
| `/my-coach` | MyCoach | Signed in |
| `/become-a-coach` | BecomeACoach | Signed in |
| `/coach`, `/coach/user/:userId`, `/coach/messages/:userId`, `/coach/user/:userId/path` | Coach portal | Coach or admin |
| `/admin/dashboard`, `/admin/coach-applications`, `/admin/coaching` | Admin | Admin |
