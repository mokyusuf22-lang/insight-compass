# CLARITY — Product Requirements Document

**Version:** 1.0  
**Last Updated:** 2026-02-12  
**Status:** Living Document

---

## 1. Product Overview

### 1.1 Vision
CLARITY is an AI-powered career coaching platform that replaces vague advice with structured thinking, practical plans, and measurable progress. It combines personality assessments with intelligent coaching to craft personalised execution paths for professionals.

### 1.2 Mission Statement
Empower professionals to achieve career clarity through evidence-based self-understanding and AI-driven execution guidance.

### 1.3 Target Audience
- **Primary:** Early-to-mid career professionals (25–40) seeking career direction, transition support, or structured growth
- **Secondary:** Career changers, recent graduates, and professionals facing impostor syndrome or burnout
- **Tertiary:** Coaches and mentors (future: community ecosystem)

### 1.4 Core Value Proposition
> "Nothing meaningful is built without structure."

CLARITY provides:
1. Deep self-understanding through layered personality assessments
2. AI coaching that adapts to your personality, goals, and context
3. A structured Skill Path with sequential, trackable execution
4. Accountability through progress tracking and weekly plans

---

## 2. User Acquisition Funnel

### 2.1 Flow Sequence (Login-Free)

```
Landing Page (/) → Start Free
    ↓
Onboarding (/onboarding) — "Tell me about yourself"
    ↓
Initial Personality Hypothesis (/initial-assessment) — 20 questions
    ↓
Initial Results (/initial-results) — Tendency Profile
    ↓
Goals & Reality (/goals-reality) — Life/Career Goals & Challenges
    ↓
AI Assessment Recommendations (/assessment-recommendations)
    ↓
[Registration Gate] — Required to save results / access Skill Path
```

### 2.2 Onboarding Data Collected
| Field | Type | Purpose |
|-------|------|---------|
| Name | Text | Personalisation |
| Age | Number | Life-stage context |
| Profession | Text | Career context |
| Marital Status | Select | Life context |
| Children | Boolean | Responsibility context |
| Location | Text | Market context |
| Education | Text | Background context |
| Hobbies | Text | Personality signals |
| Personal Goal | Text | Coaching direction |
| Career Goal | Text | Strategy formation |

### 2.3 Data Persistence
- **Guest users:** localStorage for all pre-registration data
- **Registered users:** Supabase database with RLS per user

---

## 3. Assessment System

### 3.1 Assessment Architecture

| Assessment | Questions | Type | Access | Purpose |
|-----------|-----------|------|--------|---------|
| Initial Personality Hypothesis | 20 | Free / Login-free | All users | Preliminary tendency profile |
| MBTI Assessment | Full | Premium | Paid | Personality type identification |
| DISC Assessment | Full | Premium | Paid | Behavioral tendency mapping |
| Strengths Assessment | 48 | Premium | Paid | Core strength domain ranking |

### 3.2 Initial Personality Hypothesis
- **20 generic personal questions** (no career-specific content)
- Produces a **Tendency Profile**: Introvert/Extrovert, Analytical/Intuitive, etc.
- Serves as input for AI coaching personalisation
- No login required

### 3.3 MBTI Assessment
- Full personality type assessment (e.g., INTJ, ENFP)
- Scored via `src/lib/mbtiScoring.ts`
- Results stored in `mbti_assessments` table
- Independent from DISC (can complete in any order)

### 3.4 DISC Assessment
- Behavioral tendencies: Dominance, Influence, Steadiness, Conscientiousness
- Scored via `src/lib/discScoring.ts`
- Results stored in `disc_assessments` table
- Independent from MBTI

### 3.5 Strengths Assessment
- **48 questions** across 8 domains:
  1. Strategic Thinking
  2. Analytical Thinking
  3. Execution & Delivery
  4. Influence & Communication
  5. Relationship Building
  6. Learning & Curiosity
  7. Leadership & Ownership
  8. Adaptability & Problem Solving
- 5-point Likert scale
- Output: Top 3 (Primary), Next 2 (Secondary), remaining (Supporting)

### 3.6 AI-Powered Assessment Recommendations
- Uses LLM analysis to process onboarding context, goals, and challenges
- Suggests 2–3 targeted development tools (e.g., Wheel of Life, Values Clarification, Limiting Beliefs)
- Provides relevance scores and personalised rationales

### 3.7 Assessment Independence Model
- Step 1 (Initial Hypothesis) must complete before Step 2
- MBTI and DISC are **independent** — completable in any order
- Goal Review positioned after MBTI completion
- Strengths assessment available after core assessments

---

## 4. Skill Path System

### 4.1 Architecture
```
Path (/path)
  └── Phase 1 (/path/phase/1)
  │     ├── Task 1 (/path/task/1)
  │     ├── Task 2 (/path/task/2)
  │     └── Task 3 (/path/task/3)
  └── Phase 2 (/path/phase/2)
  │     └── ...
  └── Phase N
```

### 4.2 Progression Rules
- **Strictly sequential:** Tasks and phases unlock only upon 100% completion of the preceding item
- Each task page has a **dynamic progress indicator** (e.g., "2 of 5 tasks")
- **Fixed AI Coach side panel** on every task page

### 4.3 AI Coach Panel
- Provides personalised guidance per task
- Adapts advice based on user's personality profile (MBTI, DISC, Strengths)
- CodeSignal-inspired layout with split-panel design

### 4.4 Weekly Execution Plans
- Generated per phase/week
- Track completed vs pending tasks
- Include coaching notes
- Stored in `weekly_execution_plans` table

---

## 5. Dashboard & Navigation

### 5.1 Welcome Dashboard (/welcome)
The central control center adapts by subscription status:

**Free Users — "Exploration Mode":**
- Focus on completing assessments
- Limited coaching access

**Paid Users — "Execution Mode":**
- "Today's Focus" hero element
- Profile summaries (MBTI, DISC, Strengths)
- Editable career goals
- Progress tracking toward path completion

### 5.2 Navigation Structure
| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Landing Page | No |
| `/auth` | Sign In / Sign Up | No |
| `/onboarding` | Tell Me About Yourself | No |
| `/initial-assessment` | 20-Question Hypothesis | No |
| `/initial-results` | Tendency Profile Results | No |
| `/goals-reality` | Goals & Challenges | No |
| `/assessment-recommendations` | AI Recommendations | No |
| `/welcome` | Dashboard | Yes |
| `/assessment/step1` | Step 1 Assessment | Yes |
| `/assessment/mbti` | MBTI Assessment | Yes |
| `/assessment/disc` | DISC Assessment | Yes |
| `/assessment/strengths` | Strengths Assessment | Yes |
| `/path` | Skill Path Overview | Yes |
| `/path/phase/:id` | Phase Detail | Yes |
| `/path/task/:id` | Task Detail + AI Coach | Yes |
| `/account` | Account Settings | Yes |
| `/paywall` | Subscription Upgrade | Yes |
| `/human-coaching` | Human Coaching Info | Yes |

---

## 6. Authentication & Authorization

### 6.1 Authentication Model
- **Email + Password** with email verification (no auto-confirm)
- Password strength indicator on signup
- Show/hide password toggle
- Persistent sessions (days/weeks — critical for long-form assessments)
- Sign-in confirmation screen: "Signed in as user@email.com"

### 6.2 Authorization Tiers
| Feature | Free | Pro (£49/mo) | Premium (£149/mo) |
|---------|------|-------------|-------------------|
| Onboarding + Initial Hypothesis | ✅ | ✅ | ✅ |
| AI-powered suggestions | ✅ | ✅ | ✅ |
| Core profile building | ✅ | ✅ | ✅ |
| Basic assessments | ✅ | ✅ | ✅ |
| Full AI coaching | ❌ | ✅ | ✅ |
| 3 core assessments (MBTI, DISC, Strengths) | ❌ | ✅ | ✅ |
| Personalised career roadmap | ❌ | ✅ | ✅ |
| Weekly execution guidance | ❌ | ✅ | ✅ |
| Progress tracking dashboard | ❌ | ✅ | ✅ |
| Human coaching | ❌ | ❌ | ✅ |
| Advanced strategy reviews | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

### 6.3 Admin System
- `user_roles` table with `app_role` enum: `admin | user`
- `has_role()` and `is_admin()` database functions
- `bootstrap_admin()` for initial admin setup (only works when no admins exist)
- Admins bypass all subscription gating

---

## 7. Technical Architecture

### 7.1 Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State Management | TanStack React Query |
| Routing | React Router v6 |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL with RLS |
| Auth | Lovable Cloud Auth |
| Payments | Stripe (monthly recurring) |
| AI/LLM | Lovable AI (Gemini, GPT models) |
| Animations | CSS + custom ScrollReveal |

### 7.2 Database Schema

#### Core Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profile, subscription status, assessment completion flags |
| `step1_assessments` | Initial personality hypothesis data |
| `mbti_assessments` | MBTI responses and results |
| `disc_assessments` | DISC responses and results |
| `strengths_assessments` | Strengths responses and results |
| `assessments` | Generic assessment tracking |
| `assessment_responses` | Individual question responses |
| `career_strategies` | AI-generated career strategies |
| `weekly_execution_plans` | Weekly task plans with progress |
| `user_roles` | Admin/user role assignments |

#### Security Model
- **Row Level Security (RLS)** enabled on all tables
- All user data scoped to `auth.uid() = user_id`
- No cross-user data access
- Admin override via `is_admin()` function

### 7.3 Edge Functions (Backend Functions)
| Function | Purpose |
|----------|---------|
| `recommend-assessments` | AI-powered assessment recommendations |
| `generate-hypothesis` | Generate personality hypothesis from assessment |
| `generate-strategy` | Create career strategy from assessment results |
| `generate-skill-plan` | Build skill development plan |
| `generate-weekly-plan` | Create weekly execution plans |
| `generate-coaching` | AI coaching responses |
| `generate-interview-growth` | Interview preparation guidance |
| `create-checkout` | Stripe checkout session creation |
| `create-payment` | Payment processing |
| `check-subscription` | Verify subscription status |
| `customer-portal` | Stripe customer portal access |

### 7.4 AI Integration
- **Provider:** Lovable AI (no user API keys required)
- **Supported Models:**
  - `google/gemini-3-flash-preview` — Fast, balanced (used for recommendations)
  - `google/gemini-2.5-pro` — Complex reasoning tasks
  - `openai/gpt-5` — High-accuracy coaching
- **Use Cases:** Assessment analysis, coaching, strategy generation, weekly plans

---

## 8. Design System

### 8.1 Brand Identity
- **Name:** CLARITY
- **Tagline:** "Intelligent, personalised coaching for real execution."
- **Tone:** Professional, structured, empowering — not corporate or cold

### 8.2 Visual Language
- **Typography:** Serif for editorial/statement text, Sans for UI/functional text
- **Color Palette:** Warm neutrals with teal (`bg-teal-600`) and amber (`bg-amber-100`) accents
- **Layout:** Split-panel hero, generous whitespace, chamfered corners (`.chamfer`)
- **Photography:** Diverse, inclusive professional imagery
- **Motion:** ScrollReveal animations (fade-up, fade-left, fade-right, scale)

### 8.3 Component Library
- Based on **shadcn/ui** with custom variants
- Semantic design tokens via CSS variables (`--background`, `--foreground`, `--primary`, etc.)
- Rounded buttons (`.rounded-full`) for CTAs

---

## 9. Payments & Billing

### 9.1 Pricing Tiers
| Tier | Price | Billing |
|------|-------|---------|
| Free | £0 | — |
| Pro | £49/month | Monthly recurring |
| Premium | £149/month | Monthly recurring |

### 9.2 Payment Flow
1. User clicks "Start with Pro" → navigates to `/paywall`
2. Stripe Checkout session created via `create-checkout` edge function
3. On success → `/payment-success`, subscription recorded in `profiles`
4. On cancel → `/payment-canceled`

### 9.3 Subscription Management
- `check-subscription` edge function validates active status
- `customer-portal` provides Stripe self-service portal
- `profiles` table tracks: `subscription_tier`, `last_payment_date`, `subscription_end_date`

---

## 10. Future Roadmap

### 10.1 Near-Term (Next Quarter)
- [ ] **Coach & Mentor Registration** — Allow human coaches to register on the platform
- [ ] **Wheel of Life Assessment** — Interactive radar chart visualization
- [ ] **Limiting Beliefs Inventory** — Scoring and personalised insights
- [ ] **Values Clarification Tool** — Priority-based values identification
- [ ] **Mobile-optimised assessment experience**

### 10.2 Mid-Term (3–6 Months)
- [ ] **Community Ecosystem** — Coach-client matching and community features
- [ ] **Progress Analytics Dashboard** — Charts, trends, growth metrics
- [ ] **Assessment Retake & Comparison** — Track personality/strength changes over time
- [ ] **Notification System** — Weekly nudges, task reminders, coaching prompts
- [ ] **Social Authentication** — Google, Apple sign-in

### 10.3 Long-Term (6–12 Months)
- [ ] **Team/Enterprise Plans** — Organisation-level coaching and assessments
- [ ] **Native Mobile App** — React Native or PWA
- [ ] **Advanced AI Coaching** — Voice interactions, real-time conversation
- [ ] **Certification Program** — Platform-issued skill certifications
- [ ] **API & Integrations** — Calendar, LinkedIn, learning platform integrations
- [ ] **Altruistic Free-to-Use Model** — Pivot toward accessible coaching for all

---

## 11. Success Metrics

### 11.1 Acquisition
- Funnel completion rate (Landing → Assessment Recommendations)
- Registration conversion rate
- Time to first assessment completion

### 11.2 Engagement
- Weekly active users
- Assessment completion rates
- Skill Path task completion rates
- AI coaching interaction frequency

### 11.3 Revenue
- Free → Pro conversion rate
- Pro → Premium upgrade rate
- Monthly recurring revenue (MRR)
- Churn rate

### 11.4 Outcomes
- User-reported career clarity improvement
- Goal achievement tracking
- NPS score

---

## 12. Appendix

### 12.1 Deprecated Routes
| Old Route | Redirects To |
|-----------|-------------|
| `/strategy` | `/path` |
| `/skill-plan` | `/path` |
| `/weekly` | `/path` |
| `/coaching` | `/path` |
| `/task/today` | `/path` |
| `/history` | `/welcome` |
| `/weekly-execution` | `/path` |

### 12.2 Key Files
| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Landing page |
| `src/pages/Onboarding.tsx` | User onboarding flow |
| `src/pages/InitialAssessment.tsx` | 20-question hypothesis |
| `src/pages/GoalsReality.tsx` | Goals & challenges capture |
| `src/pages/AssessmentRecommendations.tsx` | AI recommendations |
| `src/pages/SkillPath.tsx` | Main path overview |
| `src/pages/PhasePage.tsx` | Phase detail |
| `src/pages/TaskPage.tsx` | Task detail + AI coach |
| `src/pages/Welcome.tsx` | Dashboard |
| `src/contexts/AuthContext.tsx` | Authentication state |
| `src/lib/subscriptionTiers.ts` | Tier definitions |
