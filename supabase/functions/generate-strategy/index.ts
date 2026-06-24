import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert career strategist and behavioral analyst.

Your task is to generate a structured career transition strategy using:
- Personality type (MBTI)
- Behavioral tendencies (DISC)
- Core strengths
- Career goals and time horizon

You must:
- Use personality and strengths as primary inputs
- Avoid motivational or inspirational language
- Use data-driven and probabilistic phrasing
- Be practical, direct, and structured
- Assume the user wants clarity and execution, not exploration

Your output will directly power a coaching engine.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mbti_result, disc_result, strengths_result, career_goals } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user prompt with actual data
    const userPrompt = `User Profile:
- MBTI: ${mbti_result?.type || 'Not provided'} (Axes: E/I: ${mbti_result?.axes?.I || 0}% I, S/N: ${mbti_result?.axes?.N || 0}% N, T/F: ${mbti_result?.axes?.T || 0}% T, J/P: ${mbti_result?.axes?.J || 0}% J)
- DISC: Primary Style: ${disc_result?.primary_style || 'Not provided'} (D: ${disc_result?.D || 0}%, I: ${disc_result?.I || 0}%, S: ${disc_result?.S || 0}%, C: ${disc_result?.C || 0}%)
- Strengths: ${strengths_result?.ranked_strengths?.map((s: any) => `${s.name} (${s.score}%)`).join(', ') || 'Not provided'}
- Career Goals:
  - Current role: ${career_goals?.current_role || 'Not specified'}
  - Target role: ${career_goals?.target_role || 'Not specified'}
  - Biggest challenge: ${career_goals?.challenge || 'Not specified'}
  - Time horizon: ${career_goals?.timeline || 'Not specified'}

Task:
1. Estimate likelihood of successful transition (percentage range).
2. Estimate realistic transition timeline (months).
3. Generate a 3–4 phase career roadmap.
4. Identify key success factors based on personality.
5. Identify primary risk factors based on personality.

Respond with ONLY valid JSON in exactly this format:
{
  "success_likelihood": "75-90%",
  "estimated_timeline_months": 14,
  "insight": "Brief explanation of the estimate based on profile",
  "roadmap": [
    {
      "phase": "Phase Name",
      "duration_months": "0-3",
      "focus": "What to focus on"
    }
  ],
  "execution_rules": [
    "Rule based on personality"
  ],
  "risk_factors": [
    "Risk based on personality"
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let strategy;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      strategy = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse strategy response");
    }

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-strategy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
