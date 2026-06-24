import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a personalized career coach.

Your role is to translate a career strategy into focused, actionable guidance.

You must:
- Match communication style to MBTI and DISC
- Be direct, structured, and concise
- Avoid encouragement fluff
- Focus on execution, not reflection
- Treat the user as capable and self-directed

Every output must be actionable.

Adapt your tone based on personality:
- INTJ: Direct, systems-focused, efficiency-oriented
- ENFP: Exploratory but structured, connection-focused
- ISTJ: Practical and methodical, detail-oriented
- ENTJ: Strategic and commanding, results-focused
- INFJ: Insightful and purposeful, meaning-oriented
- Other types: Adapt based on the dominant functions`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mbti_result, disc_result, strengths_result, career_strategy, current_phase } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine current phase from roadmap
    const phaseInfo = career_strategy?.roadmap?.[current_phase || 0] || career_strategy?.roadmap?.[0];

    const userPrompt = `User Profile:
- MBTI: ${mbti_result?.type || 'Not provided'}
- DISC Primary Style: ${disc_result?.primary_style || 'Not provided'}
- Top Strengths: ${strengths_result?.ranked_strengths?.map((s: any) => s.name).join(', ') || 'Not provided'}

Current Strategy:
- Current phase: ${phaseInfo?.phase || 'Positioning & Direction'}
- Phase focus: ${phaseInfo?.focus || 'Define target role and position strengths'}
- Success likelihood: ${career_strategy?.success_likelihood || 'Not calculated'}
- Key execution rules: ${career_strategy?.execution_rules?.join('; ') || 'None specified'}

Task:
Generate today's coaching focus.

Requirements:
1. One clear focus for today or this week
2. Why this focus fits the user's personality
3. One concrete action to take
4. One measurable outcome

Respond with ONLY valid JSON in exactly this format:
{
  "focus": "Clear focus statement",
  "rationale": "Why this fits the user's personality",
  "action": "One specific action to take",
  "success_metric": "How to measure completion"
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
    let coaching;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      coaching = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse coaching response");
    }

    return new Response(JSON.stringify({ coaching }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-coaching error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
