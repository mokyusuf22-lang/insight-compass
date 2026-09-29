// Aura onboarding AI: goal themes and a location-aware step-by-step plan.
//
// POST { mode: "themes" | "plan", goal, about, location, checkins? }
//   themes → { summary, themes: [{ area, confidence, why }] }            (Claude Haiku 4.5)
//   plan   → { phases: [{ title, tasks: [{ title, description, where,
//               instructions[], successCriteria, estimatedMinutes, costNote }] }] }  (Claude Sonnet 5)
//
// Location guidance rules: name the country's real official bodies and processes,
// explain how to find local providers, never name private businesses.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ── Input validation ─────────────────────────────────────────
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const strList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, maxItems).map((x) => x.trim().slice(0, maxLen)) : [];

interface Input {
  mode: "themes" | "plan";
  goal: { label: string; category: string };
  about: { level: string; timeline: string; hours: string; obstacles: string[] };
  location: { country: string; countryCode: string; city: string };
  checkins: { style: string; values: string[]; wheel: Record<string, number> };
}

function parseInput(raw: any): Input | string {
  const mode = raw?.mode;
  if (mode !== "themes" && mode !== "plan") return "mode must be 'themes' or 'plan'";
  const label = str(raw?.goal?.label, 200);
  if (label.length < 3) return "goal.label is required";
  const country = str(raw?.location?.country, 80);
  if (!country) return "location.country is required";
  const wheel: Record<string, number> = {};
  if (raw?.checkins?.wheel && typeof raw.checkins.wheel === "object") {
    for (const [k, v] of Object.entries(raw.checkins.wheel).slice(0, 12)) {
      const n = num(v);
      if (n !== null) wheel[str(k, 40)] = Math.max(0, Math.min(5, n));
    }
  }
  return {
    mode,
    goal: { label, category: str(raw?.goal?.category, 60) },
    about: {
      level: str(raw?.about?.level, 60),
      timeline: str(raw?.about?.timeline, 60),
      hours: str(raw?.about?.hours, 60),
      obstacles: strList(raw?.about?.obstacles, 8, 40),
    },
    location: {
      country,
      countryCode: str(raw?.location?.countryCode, 2).toUpperCase(),
      city: str(raw?.location?.city, 80),
    },
    checkins: {
      style: str(raw?.checkins?.style, 200),
      values: strList(raw?.checkins?.values, 5, 40),
      wheel,
    },
  };
}

// ── Prompts and output schemas ───────────────────────────────
const LOCATION_RULES = `Location rules:
- Tailor every practical step to the user's country (and town, if given): use that country's real official bodies, websites, processes, documents and typical costs.
- Never name, recommend or invent private businesses, schools, gyms, instructors or apps. Instead say how to find good local options (for example: "search the official instructor register on the government website and filter by your postcode; compare two or three").
- If you are not sure how something works in that country, say what to check and where, rather than guessing.
- Give costs only as rough ranges in the local currency, and only when you are reasonably confident; otherwise leave costNote empty.`;

const THEMES_SYSTEM = `You are Aura, a warm, practical coach. From a user's goal and circumstances, identify the three themes that matter most for reaching this goal.
Write a one-sentence summary that reflects back what they told you, in second person.
Each theme: a short name (2-4 words), a confidence 50-95 that it is critical for this person, and one plain sentence on why.
Take their country into account when it changes what matters (e.g. a licensing process, an exam system, climate).
${LOCATION_RULES}`;

const PLAN_SYSTEM = `You are Aura, a practical coach who writes step-by-step plans people can act on this week.
Write exactly 3 phases for the goal, in order, each with 3 or 4 tasks. Each task is one concrete action that can be ticked off.
For every task:
- title: short imperative (max 10 words).
- description: one or two sentences on what to do and why it matters for this person.
- where: where or how to do it in their location, following the location rules. Empty string if location is irrelevant (e.g. "walk 10k").
- instructions: 2-4 short steps.
- successCriteria: how they know it is done.
- estimatedMinutes: realistic time for the task.
- costNote: rough local-currency cost range, or empty string.
Pace the plan to their weekly hours and timeline. Front-load early wins if confidence or motivation is an obstacle. Match their working style.
${LOCATION_RULES}`;

const THEMES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "themes"],
  properties: {
    summary: { type: "string" },
    themes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "confidence", "why"],
        properties: { area: { type: "string" }, confidence: { type: "integer" }, why: { type: "string" } },
      },
    },
  },
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["phases"],
  properties: {
    phases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "tasks"],
        properties: {
          title: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "description", "where", "instructions", "successCriteria", "estimatedMinutes", "costNote"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                where: { type: "string" },
                instructions: { type: "array", items: { type: "string" } },
                successCriteria: { type: "string" },
                estimatedMinutes: { type: "integer" },
                costNote: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

function userPrompt(input: Input): string {
  const { goal, about, location, checkins } = input;
  const lines = [
    `Goal: ${goal.label}${goal.category ? ` (${goal.category})` : ""}`,
    `Location: ${[location.city, location.country].filter(Boolean).join(", ")}${location.countryCode ? ` [${location.countryCode}]` : ""}`,
    about.level && `Starting point: ${about.level}`,
    about.timeline && `Timeline: ${about.timeline}`,
    about.hours && `Time available: ${about.hours} per week`,
    about.obstacles.length > 0 && `What usually gets in the way: ${about.obstacles.join(", ")}`,
  ];
  if (input.mode === "plan") {
    lines.push(
      checkins.style && `Working style: ${checkins.style}`,
      checkins.values.length > 0 && `Driven by: ${checkins.values.join(", ")}`,
      Object.keys(checkins.wheel).length > 0 &&
        `Life balance (1-5): ${Object.entries(checkins.wheel).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    );
  }
  return lines.filter(Boolean).join("\n");
}

// ── Output clean-up (belt and braces on top of the schema) ──
function cleanThemes(out: any) {
  const themes = (Array.isArray(out?.themes) ? out.themes : []).slice(0, 3).map((t: any) => ({
    area: str(t?.area, 60),
    confidence: Math.max(40, Math.min(99, Math.round(Number(t?.confidence) || 70))),
    why: str(t?.why, 300),
  })).filter((t: any) => t.area);
  if (themes.length === 0) throw new Error("No themes in model output");
  return { summary: str(out?.summary, 500), themes };
}

function cleanPlan(out: any) {
  const phases = (Array.isArray(out?.phases) ? out.phases : []).slice(0, 3).map((p: any) => ({
    title: str(p?.title, 80),
    tasks: (Array.isArray(p?.tasks) ? p.tasks : []).slice(0, 4).map((t: any) => ({
      title: str(t?.title, 120),
      description: str(t?.description, 600),
      where: str(t?.where, 600),
      instructions: strList(t?.instructions, 5, 300),
      successCriteria: str(t?.successCriteria, 300),
      estimatedMinutes: Math.max(5, Math.min(600, Math.round(Number(t?.estimatedMinutes) || 30))),
      costNote: str(t?.costNote, 200),
    })).filter((t: any) => t.title),
  })).filter((p: any) => p.title && p.tasks.length > 0);
  if (phases.length < 3) throw new Error("Plan did not have three usable phases");
  return { phases };
}

// ── Handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Only signed-in users may spend API credits.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  let input: Input | string;
  try {
    input = parseInput(await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof input === "string") return json({ error: input }, 400);

  if (!Deno.env.get("ANTHROPIC_API_KEY")) return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const isPlan = input.mode === "plan";
  try {
    const response = await client.messages.create({
      model: isPlan ? "claude-sonnet-5" : "claude-haiku-4-5",
      max_tokens: isPlan ? 16000 : 2000,
      system: isPlan ? PLAN_SYSTEM : THEMES_SYSTEM,
      messages: [{ role: "user", content: userPrompt(input) }],
      output_config: {
        format: { type: "json_schema", schema: isPlan ? PLAN_SCHEMA : THEMES_SCHEMA },
        // Effort isn't supported on Haiku 4.5; medium keeps plan latency reasonable.
        ...(isPlan ? { effort: "medium" } : {}),
      },
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (response.stop_reason === "refusal") return json({ error: "The request was declined." }, 422);
    if (response.stop_reason === "max_tokens") throw new Error("Model output was cut off");

    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
    if (!text) throw new Error("No text in model response");
    const parsed = JSON.parse(text);
    return json(isPlan ? cleanPlan(parsed) : cleanThemes(parsed));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: "Rate limit exceeded. Please try again shortly." }, 429);
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("aura-plan: invalid ANTHROPIC_API_KEY");
      return json({ error: "AI service is misconfigured." }, 500);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("aura-plan API error:", error.status, error.message);
      return json({ error: "AI service error. Please try again." }, 502);
    }
    console.error("aura-plan error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
