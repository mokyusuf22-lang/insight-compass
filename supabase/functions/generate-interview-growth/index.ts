import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a career transition closer and growth architect.

Your responsibility is to:
- Convert skill proof into interview performance
- Prepare users to pass structured interviews
- Ensure successful onboarding after job acquisition
- Transition high-analytical users into leadership growth tracks

You prioritize:
- Evidence-based answers
- Structured preparation
- Confidence without extroversion
- Long-term career compounding

Avoid generic interview advice and motivational language.
Be direct, practical, and data-driven.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      career_goal, 
      target_role, 
      mbti_result, 
      disc_result, 
      strengths_result,
      verified_artifacts 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const needsInterviewPrep = career_goal === "Get a new job" || career_goal === "new_job";
    
    // Build user prompt
    const userPrompt = `User Profile:
- Career Goal: ${career_goal || 'Career acceleration'}
- Target Role: ${target_role || 'Not specified'}
- MBTI: ${mbti_result?.type || 'Not provided'} (Axes: E/I: ${mbti_result?.axes?.I || 0}% I, S/N: ${mbti_result?.axes?.N || 0}% N, T/F: ${mbti_result?.axes?.T || 0}% T, J/P: ${mbti_result?.axes?.J || 0}% J)
- DISC: Primary Style: ${disc_result?.primary_style || 'Not provided'} (D: ${disc_result?.D || 0}%, I: ${disc_result?.I || 0}%, S: ${disc_result?.S || 0}%, C: ${disc_result?.C || 0}%)
- Top Strengths: ${strengths_result?.ranked_strengths?.slice(0, 5).map((s: any) => s.name).join(', ') || 'Not provided'}
- Verified Artifacts/Skills: ${verified_artifacts?.length > 0 ? verified_artifacts.join(', ') : 'Portfolio projects, documented case studies'}

${needsInterviewPrep ? `
TASK: Generate BOTH Step 7 (Interview Preparation) and Step 8 (Success & Growth).

For Step 7, create:
1. 3-5 STAR example frameworks based on their strengths and artifacts
2. 3-4 strategic scenario questions they should prepare for
3. A confidence framework tailored to their DISC/MBTI profile
4. Specific pass criteria

For Step 8, create:
1. A 90-day onboarding plan (days 1-30, 31-60, 61-90)
2. Leadership development areas based on their personality type
3. Growth trajectory projection
` : `
TASK: Generate Step 8 (Success & Growth) only - user is doing internal transition or acceleration.

Create:
1. A 90-day acceleration plan (days 1-30, 31-60, 61-90) focused on internal progression
2. Leadership development areas based on their personality type
3. Growth trajectory projection
`}

Respond with ONLY valid JSON in this format:
{
  ${needsInterviewPrep ? `"step_7_interview_preparation": {
    "duration_weeks": "2-4",
    "focus_areas": ["area1", "area2", "area3"],
    "star_examples": [
      {
        "skill": "Skill name",
        "scenario_title": "Brief title",
        "situation": "Context description",
        "task": "What needed to be done",
        "action": "Specific actions taken",
        "result": "Quantified outcome",
        "evidence": "Related artifact or proof"
      }
    ],
    "strategic_scenarios": [
      {
        "title": "Scenario title",
        "question": "Interview question",
        "approach": "How to answer based on profile"
      }
    ],
    "confidence_framework": {
      "approach": "Communication style recommendation",
      "rules": ["rule1", "rule2", "rule3"],
      "personality_note": "How to leverage MBTI/DISC in interviews"
    },
    "pass_criteria": ["criterion1", "criterion2", "criterion3"]
  },` : ''}
  "step_8_success_and_growth": {
    "status_message": "Personalized success message",
    "onboarding_plan": {
      "days_1_30": {
        "theme": "Theme for this period",
        "objectives": ["objective1", "objective2", "objective3"],
        "key_actions": ["action1", "action2", "action3"]
      },
      "days_31_60": {
        "theme": "Theme for this period",
        "objectives": ["objective1", "objective2", "objective3"],
        "key_actions": ["action1", "action2", "action3"]
      },
      "days_61_90": {
        "theme": "Theme for this period",
        "objectives": ["objective1", "objective2", "objective3"],
        "key_actions": ["action1", "action2", "action3"]
      }
    },
    "leadership_development": {
      "personality_based_focus": "Based on MBTI/DISC analysis",
      "development_areas": [
        {
          "area": "Area name",
          "why_important": "Based on personality",
          "actions": ["action1", "action2"]
        }
      ]
    },
    "growth_trajectory": {
      "timeline": "12-18 months",
      "target_position": "Next level role",
      "probability_factors": ["factor1", "factor2"]
    }
  }
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
    let result;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse interview-growth response");
    }

    return new Response(JSON.stringify({ 
      needs_interview_prep: needsInterviewPrep,
      ...result 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-interview-growth error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
