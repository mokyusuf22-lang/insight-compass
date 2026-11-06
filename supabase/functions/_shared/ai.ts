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

/** The signed-in user (guest accounts included), or null. */
export async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  return error ? null : user;
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
 * Calls the primary model and, if that fails for any reason other than a bad API key,
 * retries once on the fallback model so the user still gets an AI answer.
 * `clean` validates/normalises the parsed JSON and should throw if it's unusable.
 */
export async function generate<T>(spec: CallSpec, clean: (out: unknown) => T, tag: string): Promise<T> {
  if (!Deno.env.get("ANTHROPIC_API_KEY")) throw new AiError("ANTHROPIC_API_KEY is not configured.", 500, "config");
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const models = spec.model === FALLBACK_MODEL ? [spec.model] : [spec.model, FALLBACK_MODEL];
  let last: unknown;
  for (const [i, model] of models.entries()) {
    try {
      const started = Date.now();
      const timeoutMs = i === 0 ? spec.timeoutMs : Math.min(spec.timeoutMs, 55_000);
      const out = clean(await callOnce(client, spec, model, timeoutMs));
      console.log(`${tag}: ok on ${model} in ${Date.now() - started}ms`);
      return out;
    } catch (error) {
      last = error;
      if (error instanceof Anthropic.AuthenticationError) {
        console.error(`${tag}: invalid ANTHROPIC_API_KEY`);
        throw new AiError("AI service is misconfigured (API key).", 500, "auth");
      }
      console.error(`${tag}: ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  if (last instanceof AiError) throw last;
  if (last instanceof Anthropic.RateLimitError) throw new AiError("Rate limit exceeded. Please try again shortly.", 429, "rate_limit");
  if (last instanceof Anthropic.APIError) throw new AiError("AI service error. Please try again.", 502, "api");
  throw new AiError(last instanceof Error ? last.message : "Unknown error", 500, "unknown");
}

export function errorResponse(error: unknown) {
  if (error instanceof AiError) return json({ error: error.message, stage: error.stage }, error.status);
  console.error("unexpected error:", error);
  return json({ error: error instanceof Error ? error.message : "Unknown error", stage: "unknown" }, 500);
}
