// Aura onboarding AI: goal themes and a location-aware step-by-step plan.
//
// POST { mode: "themes" | "plan", goal, about, location, checkins? }
//   themes → { summary, themes: [{ area, confidence, why }] }            (Claude Haiku 5.5)
//   plan   → { phases: [{ title, tasks: [{ title, description, where,
//               instructions[], successCriteria, estimatedMinutes, costNote }] }] }  (Claude Sonnet 5.5)
// Either call falls back to Claude Haiku 5.5 once if the first model fails.
// Errors come back as { error, stage } so the client can log why.
//
// The prompts are in ../_shared/prompts.ts (readable copy: docs/AI_PROMPTS.md).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceQuota, errorResponse, generate, getUser, json, withCors } from "../_shared/ai.ts";
import { PLAN_SYSTEM, THEMES_SYSTEM } from "../_shared/prompts.ts";

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

// ── Output schemas ───────────────────────────────────────────
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
serve(withCors(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Only signed-in users (guests included) may spend API credits.
  if (!(await getUser(req))) return json({ error: "Unauthorized", stage: "auth" }, 401);

  let input: Input | string;
  try {
    input = parseInput(await req.json());
  } catch {
    return json({ error: "Invalid JSON body", stage: "input" }, 400);
  }
  if (typeof input === "string") return json({ error: input, stage: "input" }, 400);

  const overLimit = await enforceQuota(req, input.mode === "plan" ? "plan" : "themes");
  if (overLimit) return overLimit;

  try {
    if (input.mode === "plan") {
      const out = await generate(
        { model: "claude-sonnet-5-5", system: PLAN_SYSTEM, user: userPrompt(input), schema: PLAN_SCHEMA,
          maxTokens: 16000, effort: "low", timeoutMs: 85_000 },
        cleanPlan, "aura-plan:plan",
      );
      return json(out);
    }
    const out = await generate(
      { model: "claude-haiku-5-5", system: THEMES_SYSTEM, user: userPrompt(input), schema: THEMES_SCHEMA,
        maxTokens: 4000, effort: "low", timeoutMs: 40_000 },
      cleanThemes, "aura-plan:themes",
    );
    return json(out);
  } catch (error) {
    return errorResponse(error);
  }
}));
