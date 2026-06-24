import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a career execution architect.

Your role is to convert high-level career strategies into concrete, testable skill development plans.

You prioritize:
- Structure over motivation
- Proof over intention
- Execution over exploration

You adapt your output to the user's personality profile.
You avoid vague advice, fluff, and generic learning recommendations.

Never name specific courses or platforms.
Never overload the user with parallel tasks.
Never use soft or subjective progress markers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { career_strategy, mbti_result, disc_result, strengths_result, career_goals } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating skill plan for strategy:", career_strategy?.roadmap?.length, "phases");

    const userPrompt = `Career Strategy:
- Success Likelihood: ${career_strategy?.success_likelihood || 'Not provided'}
- Timeline: ${career_strategy?.estimated_timeline_months || 'Not provided'} months
- Roadmap Phases:
${career_strategy?.roadmap?.map((p: any, i: number) => `  ${i + 1}. ${p.phase} (Months ${p.duration_months}): ${p.focus}`).join('\n') || 'Not provided'}
- Execution Rules: ${career_strategy?.execution_rules?.join('; ') || 'Not provided'}
- Risk Factors: ${career_strategy?.risk_factors?.join('; ') || 'Not provided'}

User Profile:
- MBTI: ${mbti_result?.type || 'Not provided'} (E/I: ${mbti_result?.axes?.I || 0}% I, S/N: ${mbti_result?.axes?.N || 0}% N, T/F: ${mbti_result?.axes?.T || 0}% T, J/P: ${mbti_result?.axes?.J || 0}% J)
- DISC: Primary Style: ${disc_result?.primary_style || 'Not provided'} (D: ${disc_result?.D || 0}%, I: ${disc_result?.I || 0}%, S: ${disc_result?.S || 0}%, C: ${disc_result?.C || 0}%)
- Top Strengths: ${strengths_result?.ranked_strengths?.slice(0, 3).map((s: any) => s.name).join(', ') || 'Not provided'}

Career Goals:
- Current role: ${career_goals?.current_role || 'Not specified'}
- Target role: ${career_goals?.target_role || 'Not specified'}
- Biggest challenge: ${career_goals?.challenge || 'Not specified'}
- Time horizon: ${career_goals?.timeline || 'Not specified'}

Task:
For EACH roadmap phase, generate:
1. 3-5 skill clusters required to complete the phase
2. Within each cluster, define 2-4 specific, concrete skills
3. Define 2-3 proof artifacts that demonstrate skill acquisition
4. Define clear exit criteria that determines phase completion
5. Add personality-based execution notes for MBTI/DISC/Strengths

Respond with ONLY valid JSON in exactly this format:
{
  "skill_development_plan": [
    {
      "phase": "Phase Name",
      "duration": "Months X-Y",
      "skill_clusters": [
        {
          "cluster_name": "Cluster Name",
          "skills": ["Specific skill 1", "Specific skill 2"]
        }
      ],
      "proof_artifacts": ["Artifact 1", "Artifact 2"],
      "exit_criteria": "Clear, objective condition that defines completion",
      "personality_execution_notes": "How this phase should be approached based on MBTI/DISC/Strengths"
    }
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

    console.log("AI response received, parsing...");

    let skillPlan;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      skillPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse skill plan response");
    }

    console.log("Skill plan generated with", skillPlan.skill_development_plan?.length, "phases");

    return new Response(JSON.stringify({ skill_plan: skillPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-skill-plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
