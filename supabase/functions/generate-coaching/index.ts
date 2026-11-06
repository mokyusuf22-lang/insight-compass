// Task-page "Ask Aura": answers a question about one task in the user's plan.
//
// POST { question, goal?, task_context: { title, description?, phase? } }
//   → { answer }                                         (Claude Haiku 5.5)
// The user's location is read from their latest path commitment, so answers can be local.
// The prompt is in ../_shared/prompts.ts (readable copy: docs/AI_PROMPTS.md).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, generate, getUser, json } from "../_shared/ai.ts";
import { TASK_COACH_SYSTEM } from "../_shared/prompts.ts";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer"],
  properties: { answer: { type: "string" } },
};

async function userLocation(req: Request, userId: string): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data } = await supabase
      .from("path_commitments")
      .select("chosen_path")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const loc = (data?.chosen_path as { location?: { city?: string; country?: string } } | null)?.location;
    return [loc?.city, loc?.country].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await getUser(req);
  if (!user) return json({ error: "Unauthorized", stage: "auth" }, 401);

  let raw: { question?: unknown; goal?: unknown; task_context?: { title?: unknown; description?: unknown; phase?: unknown } };
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body", stage: "input" }, 400);
  }
  const question = str(raw?.question, 1000);
  const taskTitle = str(raw?.task_context?.title, 200);
  if (question.length < 2) return json({ error: "question is required", stage: "input" }, 400);
  if (!taskTitle) return json({ error: "task_context.title is required", stage: "input" }, 400);

  const location = await userLocation(req, user.id);
  const prompt = [
    raw?.goal && `Goal: ${str(raw.goal, 200)}`,
    location && `Location: ${location}`,
    raw?.task_context?.phase && `Current phase: ${str(raw.task_context.phase, 100)}`,
    `Task: ${taskTitle}`,
    raw?.task_context?.description && `Task details: ${str(raw.task_context.description, 800)}`,
    "",
    `Their question: ${question}`,
  ].filter((l) => l !== false && l !== undefined && l !== null).join("\n");

  try {
    const out = await generate(
      { model: "claude-haiku-5-5", system: TASK_COACH_SYSTEM, user: prompt, schema: ANSWER_SCHEMA,
        maxTokens: 2000, effort: "low", timeoutMs: 40_000 },
      (o) => {
        const answer = str((o as { answer?: unknown })?.answer, 3000);
        if (!answer) throw new Error("Empty answer");
        return { answer };
      },
      "generate-coaching",
    );
    return json(out);
  } catch (error) {
    return errorResponse(error);
  }
});
