import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reality_report, onboarding } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an elite career strategist. Given a user's Reality Report (strengths, constraints, risks, growth direction) and their demographic/goal context, generate 2-4 distinct career path options.

Each path must be realistic given the user's constraints and leverage their strengths.

Return ONLY valid JSON matching this structure:
{
  "paths": [
    {
      "title": "Short compelling title (3-6 words)",
      "tagline": "One sentence hook",
      "description": "2-3 sentences explaining this path",
      "time_horizon": "e.g. 6-12 months",
      "difficulty": "moderate" | "challenging" | "ambitious",
      "key_actions": ["action 1", "action 2", "action 3"],
      "fits_because": "1 sentence on why this suits them specifically",
      "risk_note": "1 sentence on the main risk or tradeoff"
    }
  ]
}

Rules:
- Generate 2-4 paths, ordered from most conservative to most ambitious
- Each path must be meaningfully different (not variations of the same thing)
- Use the user's actual profession, goals, and constraints — no generic advice
- Key actions must be specific and executable, not vague
- Time horizons should be realistic given constraints`;

    const userPrompt = `REALITY REPORT:
- Headline: ${reality_report.headline}
- Strengths: ${reality_report.strengths?.join("; ")}
- Constraints: ${reality_report.constraints?.join("; ")}
- Risks: ${reality_report.risks?.join("; ")}
- Growth Direction: ${reality_report.growth_direction}
- Key Insight: ${reality_report.key_insight}

USER CONTEXT:
- Name: ${onboarding.name}
- Age: ${onboarding.age}
- Profession: ${onboarding.profession}
- Education: ${onboarding.education}
- Location: ${onboarding.location}
- Personal Goal: ${onboarding.personalGoal}
- Career Goal: ${onboarding.careerGoal}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const parsed = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-path-options error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
