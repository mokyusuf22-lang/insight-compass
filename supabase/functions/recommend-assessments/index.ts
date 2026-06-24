import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a career development advisor specializing in assessment recommendations.

Based on the user's profile, goals, and challenges, recommend 2-3 targeted assessments that would be most valuable for their development.

Available assessments to recommend:
1. "wheel_of_life" - Wheel of Life Assessment: Evaluates 8 life areas (career, finances, health, relationships, personal growth, fun/recreation, physical environment, family/friends). Best for: work-life balance issues, feeling unfulfilled, unclear priorities, life transitions.

2. "values_clarification" - Values Clarification Exercise: Identifies core personal values and how they align with career choices. Best for: feeling misaligned with work, career change considerations, decision-making struggles, lack of motivation.

3. "skills_gap" - Skills Gap Analysis: Identifies current skills vs. required skills for target role. Best for: career advancement goals, role transitions, unclear development path.

4. "emotional_intelligence" - Emotional Intelligence Assessment: Measures self-awareness, self-regulation, motivation, empathy, social skills. Best for: leadership roles, team conflicts, communication challenges, managing stress.

5. "energy_audit" - Energy Audit: Tracks activities that energize vs. drain. Best for: burnout risk, productivity issues, job crafting opportunities.

6. "limiting_beliefs" - Limiting Beliefs Inventory: Identifies self-sabotaging thought patterns. Best for: impostor syndrome, perfectionism, fear of failure, self-doubt.

Respond with ONLY valid JSON in this format:
{
  "recommendations": [
    {
      "assessment_id": "wheel_of_life",
      "name": "Wheel of Life Assessment",
      "relevance_score": 95,
      "reason": "One sentence explaining why this is relevant to their specific situation",
      "key_insight": "What they'll discover from this assessment"
    }
  ],
  "priority_focus": "A brief statement about what they should focus on first based on their challenges"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { onboarding_data, goals_data, personality_hypothesis } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `User Profile:
${onboarding_data?.name ? `- Name: ${onboarding_data.name}` : ''}
${onboarding_data?.age ? `- Age: ${onboarding_data.age}` : ''}
${onboarding_data?.profession ? `- Profession: ${onboarding_data.profession}` : ''}
${onboarding_data?.maritalStatus ? `- Marital Status: ${onboarding_data.maritalStatus}` : ''}
${onboarding_data?.children ? `- Has Children: ${onboarding_data.children}` : ''}
${onboarding_data?.education ? `- Education: ${onboarding_data.education}` : ''}
${onboarding_data?.hobbies ? `- Hobbies: ${onboarding_data.hobbies}` : ''}

Goals:
${onboarding_data?.personalGoal ? `- Personal Goal: ${onboarding_data.personalGoal}` : ''}
${onboarding_data?.careerGoal ? `- Career Goal: ${onboarding_data.careerGoal}` : ''}
${goals_data?.life_goals ? `- Life Goals: ${goals_data.life_goals}` : ''}
${goals_data?.career_goals ? `- Detailed Career Goals: ${goals_data.career_goals}` : ''}

Challenges & Barriers:
${goals_data?.challenges ? goals_data.challenges : 'Not specified'}

${personality_hypothesis ? `Personality Hypothesis: ${JSON.stringify(personality_hypothesis)}` : ''}

Based on this information, recommend 2-3 assessments that would be most valuable for this person's development. Consider their specific challenges, goals, and life situation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
    let recommendations;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse recommendations response");
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("recommend-assessments error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
