import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a precision career execution coach.

Your role is to generate focused weekly tasks from a skill development plan.

You must:
- Match communication style to user's MBTI and DISC profile
- Be direct, structured, and concise
- Avoid encouragement fluff and motivational language
- Focus on execution, not reflection
- Treat the user as capable and self-directed

Communication style by type:
- INTJ/ISTJ: Logic-first, structured, minimal social framing
- ENTJ/ESTJ: Direct, outcome-focused, efficiency-oriented
- INFJ/INFP: Purpose-driven but still practical
- ENFP/ENTP: Exploratory but with clear constraints

Every output must be immediately actionable.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      skill_development_plan, 
      current_phase_index,
      completed_skills,
      mbti_result, 
      disc_result, 
      strengths_result,
      career_goals,
      hours_available,
      week_number
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentPhase = skill_development_plan?.skill_development_plan?.[current_phase_index || 0];
    
    console.log("Generating weekly plan for phase:", currentPhase?.phase, "week:", week_number);

    const userPrompt = `User Profile:
- MBTI: ${mbti_result?.type || 'Not provided'}
- DISC: Primary Style: ${disc_result?.primary_style || 'Not provided'}
- Top Strengths: ${strengths_result?.ranked_strengths?.slice(0, 3).map((s: any) => s.name).join(', ') || 'Not provided'}

Career Context:
- Current role: ${career_goals?.current_role || 'Not specified'}
- Target role: ${career_goals?.target_role || 'Not specified'}
- Timeline: ${career_goals?.timeline || 'Not specified'}

Current Phase: ${currentPhase?.phase || 'Not specified'}
Phase Duration: ${currentPhase?.duration || 'Not specified'}
Phase Exit Criteria: ${currentPhase?.exit_criteria || 'Not specified'}

Skill Clusters for This Phase:
${currentPhase?.skill_clusters?.map((c: any, i: number) => `${i + 1}. ${c.cluster_name}: ${c.skills.join(', ')}`).join('\n') || 'Not provided'}

Proof Artifacts Required:
${currentPhase?.proof_artifacts?.join(', ') || 'Not provided'}

Personality Execution Notes: ${currentPhase?.personality_execution_notes || 'Not provided'}

Completed Skills So Far: ${completed_skills?.length > 0 ? completed_skills.join(', ') : 'None yet'}

Week Number in Phase: ${week_number || 1}
Hours Available This Week: ${hours_available || 'Flexible (5-10 hours)'}

Task:
Generate this week's execution plan with:
1. Adaptive number of tasks (3-5 based on complexity and hours available)
2. Clear success condition for each task
3. Estimated effort in hours
4. Priority ranking
5. Brief coaching note matching the user's communication style

Respond with ONLY valid JSON in exactly this format:
{
  "week_focus": "One sentence describing this week's primary focus",
  "tasks": [
    {
      "id": 1,
      "title": "Clear, actionable task title",
      "description": "Specific instructions on what to do",
      "skill_cluster": "Which skill cluster this advances",
      "success_condition": "How to know it's complete",
      "estimated_hours": 2,
      "priority": "high"
    }
  ],
  "coaching_note": "Brief, personality-matched guidance for the week",
  "phase_progress_indicator": "Beginning/Middle/Nearing completion of phase"
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

    let weeklyPlan;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      weeklyPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse weekly plan response");
    }

    console.log("Weekly plan generated with", weeklyPlan.tasks?.length, "tasks");

    return new Response(JSON.stringify({ weekly_plan: weeklyPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-weekly-plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
