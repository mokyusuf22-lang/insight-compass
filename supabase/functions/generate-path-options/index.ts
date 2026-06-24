import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reality_report, onboarding, user_reflections } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discType = (reality_report as any)?.disc_primary || '';
    const toneGuide = discType === 'D'
      ? 'Be direct and results-focused. Short sentences. No fluff.'
      : discType === 'I'
      ? 'Be warm and energising. Focus on possibilities and excitement.'
      : discType === 'S'
      ? 'Be supportive and steady. Emphasise stability and manageable steps.'
      : discType === 'C'
      ? 'Be precise and logical. Reference data and structured reasoning.'
      : 'Be clear, warm, and encouraging.';

    const systemPrompt = `You are a life and career coach. Given someone's reality snapshot and personal context, generate 3-4 genuinely different life options they could pursue. Think broadly — not just career moves, but also coaching, relocation, study, life redesign, business, community, and more.

Tone: ${toneGuide}

Return ONLY valid JSON:
{
  "paths": [
    {
      "title": "2-4 word title",
      "tagline": "One punchy sentence — what this option IS and why it could work for them",
      "description": "1-2 sentences max. What the next 6-12 months actually looks like on this path.",
      "time_horizon": "e.g. 3-6 months",
      "difficulty": "moderate" | "challenging" | "ambitious",
      "key_actions": ["First step (very specific)", "Second step"],
      "fits_because": "One sentence tied to their actual strengths or values",
      "risk_note": "One sentence on the real tradeoff"
    }
  ]
}

Rules:
- 3-4 paths, from most grounded to most ambitious
- Each path must be a meaningfully different TYPE of move (e.g. one career pivot, one coaching/support route, one relocation/new environment, one life redesign)
- Include at least one option that involves getting external support (coach, mentor, community)
- Titles must be specific to THEM — no generic "Career Change" — e.g. "Move to Berlin, Lead Tech", "Train as a Coach", "Go Independent in 90 Days"
- tagline is the most important field — make it compelling and personal
- key_actions: 2 only, ultra-specific, completable this month`;

    const reflectionsBlock = user_reflections?.length
      ? `\nUSER'S OWN REFLECTIONS (incorporate these — they reveal what the user is already thinking):\n${user_reflections.map((r: any) => `- Q: ${r.question}\n  A: ${r.answer}`).join("\n")}`
      : "";

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
- Career Goal: ${onboarding.careerGoal}${reflectionsBlock}`;

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
