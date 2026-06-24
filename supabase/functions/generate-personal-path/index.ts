import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a career execution architect specializing in creating personalized development paths.

Your role is to convert a user's commitment, reality profile, and chosen path into a concrete, phased execution plan with specific tasks.

Rules:
- Each phase should have 3-5 tasks
- Tasks must be concrete and actionable (not vague)
- Tasks should be sequential — each builds on the previous
- Adapt task difficulty and style to the user's personality and constraints
- Include estimated time per task (15-60 minutes)
- Each task needs clear success criteria
- Never name specific courses, platforms, or tools
- Keep tasks achievable within the user's stated time budget
- Use the user's constraints to shape realistic expectations`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commitment, reality_report, onboarding, chosen_path } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating personal path for:", chosen_path?.title);

    const userPrompt = `User Commitment:
- Chosen Path: ${chosen_path?.title || 'Not specified'}
- Path Description: ${chosen_path?.tagline || chosen_path?.description || 'Not specified'}
- Time Budget: ${commitment?.time_budget || 'Not specified'}
- Intent: ${commitment?.intent || 'Not specified'}
- Constraints: ${commitment?.constraints || 'None'}
- Focus Area: ${commitment?.focus_area || 'Not specified'}

Reality Report:
- Key Strengths: ${JSON.stringify(reality_report?.strengths || [])}
- Key Constraints: ${JSON.stringify(reality_report?.key_constraints || [])}
- Risks/Blindspots: ${JSON.stringify(reality_report?.risks || [])}
- Summary: ${reality_report?.generated_summary || 'Not available'}

User Context:
- Name: ${onboarding?.name || 'Not specified'}
- Profession: ${onboarding?.profession || 'Not specified'}
- Career Goal: ${onboarding?.careerGoal || 'Not specified'}
- Personal Goal: ${onboarding?.personalGoal || 'Not specified'}

Path Details (if available):
- Phases: ${JSON.stringify(chosen_path?.phases || chosen_path?.milestones || [])}
- Time Horizon: ${chosen_path?.time_horizon || 'Not specified'}
- Difficulty: ${chosen_path?.difficulty || 'Not specified'}

Task:
Generate a personal execution path with 3-4 phases. Each phase should have 3-5 concrete tasks.

Respond with ONLY valid JSON in exactly this format:
{
  "title": "Path title based on the chosen path",
  "description": "One-sentence description of the overall path",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase Name",
      "duration": "2-3 weeks",
      "goal": "Clear phase objective",
      "successDefinition": "How to know this phase is complete",
      "tasks": [
        {
          "title": "Specific task name",
          "description": "What to do and why it matters",
          "type": "reading|practice|reflection|project",
          "estimatedMinutes": 30,
          "successCriteria": "How to know this task is done",
          "instructions": ["Step 1", "Step 2", "Step 3"]
        }
      ]
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

    let personalPath;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      personalPath = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse personal path response");
    }

    // Enrich phases with IDs and status
    const enrichedPhases = (personalPath.phases || []).map((phase: any, phaseIdx: number) => ({
      ...phase,
      id: `phase${phaseIdx}`,
      progress: 0,
      tasks: (phase.tasks || []).map((task: any, taskIdx: number) => ({
        ...task,
        id: `phase${phaseIdx}-task${taskIdx}`,
        status: phaseIdx === 0 && taskIdx === 0 ? 'available' : 'locked',
      })),
    }));

    personalPath.phases = enrichedPhases;

    console.log("Personal path generated with", enrichedPhases.length, "phases");

    return new Response(JSON.stringify({ personal_path: personalPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-personal-path error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
