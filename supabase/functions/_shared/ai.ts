// Shared Claude helpers for edge functions: auth check, structured-output call with
// one fallback model, and consistent error responses.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

export { Anthropic };

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/**
 * Browser origins allowed to call the functions, from the ALLOWED_ORIGINS secret
 * (comma-separated, e.g. "https://bemore.app,https://www.bemore.app,http://localhost:8080").
 * Unset means any origin, which is only acceptable before launch.
 */
function allowedOrigin(req: Request): string {
  const list = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return "*";
  const origin = req.headers.get("Origin") ?? "";
  // Vercel preview deployments: allow "https://*.vercel.app"-style wildcard entries.
  const ok = list.some((o) =>
    o === origin || (o.includes("*") && new RegExp(`^${o.split("*").map(escapeRe).join("[a-z0-9-]+")}$`).test(origin))
  );
  return ok ? origin : list[0];
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps a handler: answers CORS preflight and stamps the allowed origin on every response. */
export function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const origin = allowedOrigin(req);
    const res = req.method === "OPTIONS" ? new Response(null, { headers: corsHeaders }) : await handler(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    headers.set("Access-Control-Allow-Origin", origin);
    if (origin !== "*") headers.set("Vary", "Origin");
    return new Response(res.body, { status: res.status, headers });
  };
}

/** A Supabase client acting as the caller, so RLS and auth.uid() apply. */
export function userClient(req: Request) {
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
}

/** The signed-in user (guest accounts included), or null. */
export async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  return error ? null : user;
}

/**
 * Per-user AI limits (see consume_ai_quota in the security_hardening migration).
 * Returns a 429 response when the user is over their limit, otherwise null.
 * If the quota function is missing (migration not run yet) it logs and lets the call through.
 */
export async function enforceQuota(req: Request, kind: "themes" | "plan" | "qa"): Promise<Response | null> {
  const { data, error } = await userClient(req).rpc("consume_ai_quota", { p_kind: kind });
  if (error) {
    console.error(`quota check failed (${kind}), allowing call:`, error.message);
    return null;
  }
  return data === false
    ? json({ error: "You’ve reached today’s limit for AI requests. Please try again tomorrow.", stage: "quota" }, 429)
    : null;
}

export const FALLBACK_MODEL = "claude-haiku-5-5";

export interface CallSpec {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens: number;
  effort: "low" | "medium" | "high";
  /** Primary-model timeout. The fallback gets at most 55s, so both fit in the edge function's ~150s limit. */
  timeoutMs: number;
}

export class AiError extends Error {
  constructor(message: string, readonly status: number, readonly stage: string) {
    super(message);
  }
}

async function callOnce(client: Anthropic, spec: CallSpec, model: string, timeoutMs: number): Promise<unknown> {
  // Streaming keeps long generations from hitting HTTP timeouts; finalMessage() gives the whole reply.
  const message = await client.messages
    .stream(
      {
        model,
        max_tokens: spec.maxTokens,
        system: spec.system,
        messages: [{ role: "user", content: spec.user }],
        output_config: { effort: spec.effort, format: { type: "json_schema", schema: spec.schema } },
      },
      { timeout: timeoutMs, maxRetries: 0 },
    )
    .finalMessage();

  if (message.stop_reason === "refusal") throw new AiError("The request was declined.", 422, "refusal");
  if (message.stop_reason === "max_tokens") throw new AiError("Model output was cut off.", 502, "max_tokens");
  const text = message.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
  if (!text) throw new AiError("No text in model response.", 502, "empty");
  return JSON.parse(text);
}

/**
 * Backup AI providers, tried in this order after Claude. Each one is used only if its key is set
 * (supabase secrets set GROQ_API_KEY=...). All three speak the same "OpenAI-style" chat API.
 * Model names can be changed with a secret (e.g. GROQ_MODEL) without redeploying code.
 */
const BACKUP_PROVIDERS = [
  { name: "groq", keyEnv: "GROQ_API_KEY", modelEnv: "GROQ_MODEL", model: "llama-3.3-70b-versatile",
    url: "https://api.groq.com/openai/v1/chat/completions" },
  { name: "mistral", keyEnv: "MISTRAL_API_KEY", modelEnv: "MISTRAL_MODEL", model: "mistral-small-latest",
    url: "https://api.mistral.ai/v1/chat/completions" },
  { name: "openrouter", keyEnv: "OPENROUTER_API_KEY", modelEnv: "OPENROUTER_MODEL", model: "meta-llama/llama-3.3-70b-instruct:free",
    url: "https://openrouter.ai/api/v1/chat/completions" },
] as const;

/** One call to an OpenAI-style chat API, asking for JSON that matches the schema. */
async function callOpenAiStyle(
  p: (typeof BACKUP_PROVIDERS)[number], key: string, spec: CallSpec, timeoutMs: number,
): Promise<{ out: unknown; model: string }> {
  const model = Deno.env.get(p.modelEnv) || p.model;
  const res = await fetch(p.url, {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: Math.min(spec.maxTokens, 8192),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content:
          `${spec.system}\n\nReply with a single JSON object only (no markdown, no commentary) that matches this JSON Schema:\n${JSON.stringify(spec.schema)}` },
        { role: "user", content: spec.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${p.name} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${p.name}: empty reply`);
  // Some models still wrap JSON in ```json fences.
  return { out: JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "")), model };
}

/** Whole chain must finish inside the edge function's ~150s wall-clock limit. */
const CHAIN_BUDGET_MS = 140_000;

/**
 * Tries each AI in turn until one gives a usable answer, from best to cheapest:
 *   1. Claude (spec.model)  2. Claude Haiku  3. Groq  4. Mistral  5. OpenRouter free model
 * Providers without a key are skipped. If all fail, the browser falls back to Aura's built-in content.
 * `clean` validates/normalises the parsed JSON and should throw if it's unusable.
 */
export async function generate<T>(spec: CallSpec, clean: (out: unknown) => T, tag: string): Promise<T> {
  const started = Date.now();
  const remaining = () => CHAIN_BUDGET_MS - (Date.now() - started);

  type Attempt = { label: string; capMs: number; run: (timeoutMs: number) => Promise<{ out: unknown; model: string }> };
  const attempts: Attempt[] = [];

  if (Deno.env.get("ANTHROPIC_API_KEY")) {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY
    const models = spec.model === FALLBACK_MODEL ? [spec.model] : [spec.model, FALLBACK_MODEL];
    models.forEach((model, i) => attempts.push({
      label: model,
      capMs: i === 0 ? spec.timeoutMs : Math.min(spec.timeoutMs, 40_000),
      run: async (t) => ({ out: await callOnce(client, spec, model, t), model }),
    }));
  }
  for (const p of BACKUP_PROVIDERS) {
    const key = Deno.env.get(p.keyEnv);
    if (key) attempts.push({ label: p.name, capMs: 30_000, run: (t) => callOpenAiStyle(p, key, spec, t) });
  }
  if (attempts.length === 0) throw new AiError("No AI provider key is configured.", 500, "config");

  let last: unknown;
  for (const a of attempts) {
    const timeoutMs = Math.min(a.capMs, remaining() - 3_000);
    if (timeoutMs < 8_000) { console.error(`${tag}: out of time before ${a.label}`); break; }
    const t0 = Date.now();
    try {
      const { out, model } = await a.run(timeoutMs);
      const cleaned = clean(out);
      console.log(`${tag}: ok on ${a.label} (${model}) in ${Date.now() - t0}ms`);
      return cleaned;
    } catch (error) {
      last = error;
      if (error instanceof Anthropic.AuthenticationError) console.error(`${tag}: invalid ANTHROPIC_API_KEY`);
      console.error(`${tag}: ${a.label} failed:`, error instanceof Error ? error.message : error);
    }
  }
  if (last instanceof AiError) throw last;
  if (last instanceof Anthropic.AuthenticationError && attempts.length <= 2) {
    throw new AiError("AI service is misconfigured (API key).", 500, "auth");
  }
  if (last instanceof Anthropic.RateLimitError) throw new AiError("Rate limit exceeded. Please try again shortly.", 429, "rate_limit");
  throw new AiError("AI service error. Please try again.", 502, "api");
}

export function errorResponse(error: unknown) {
  if (error instanceof AiError) return json({ error: error.message, stage: error.stage }, error.status);
  console.error("unexpected error:", error);
  // Don't echo internal error details to the browser; they're in the function logs.
  return json({ error: "Something went wrong. Please try again.", stage: "unknown" }, 500);
}
