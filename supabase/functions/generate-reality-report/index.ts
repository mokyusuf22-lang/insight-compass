import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BlobTreeData {
  current_blob: number;
  desired_blob: number;
  current_title: string;
  current_traits: string[];
  desired_title: string;
  desired_traits: string[];
}

interface ValueMapData {
  ranked_values: string[];
  value_names: string[];
  archetype: string;
}

interface OnboardingData {
  name: string;
  age: string;
  profession: string;
  education: string;
  location: string;
  maritalStatus: string;
  hasChildren: string;
  hobbies: string;
  personalGoal: string;
  careerGoal: string;
}

interface RequestBody {
  blob_tree: BlobTreeData;
  value_map: ValueMapData;
  onboarding: OnboardingData;
  disc_primary?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log("Reality report request received");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const disc = body.disc_primary || '';
    const toneGuide = disc === 'D'
      ? 'Direct and results-focused. Short sentences. Lead with the bottom line. No filler.'
      : disc === 'I'
      ? 'Warm and energising. Friendly tone. Focus on possibilities and what excites them.'
      : disc === 'S'
      ? 'Calm and supportive. Reassuring tone. Emphasise stability and manageable next steps.'
      : disc === 'C'
      ? 'Precise and logical. Reference specific data points. Structured and factual.'
      : 'Clear, warm, and direct.';

    const systemPrompt = `You are a career and life coach generating a personal Reality Report.

Tone: ${toneGuide}

Write for the person — make it feel like you know them. Be honest, not harsh. Be specific, not generic.

Return ONLY valid JSON in this exact structure:
{
  "headline": "5-8 words summarising their current reality",
  "summary": "2-3 sentences max. Who they are right now — emotional state, context, and what's driving them.",
  "strengths": ["3-4 specific strengths from the data — short phrases"],
  "constraints": ["2-3 real barriers they face — honest and specific"],
  "risks": ["2-3 blind spots or risks — named plainly"],
  "growth_direction": "One sentence: the gap between where they are and where they want to be.",
  "key_insight": "One sentence: the most important thing for them to hear right now."
}

Rules:
- summary: 2-3 sentences ONLY. Not paragraphs.
- strengths/constraints/risks: short, punchy phrases — 5-10 words each
- growth_direction and key_insight: one sentence each, no more
- Reference their actual data, not generic advice`;

    const userPrompt = `Here is the data from a user's assessments and personal context:

## Personal Context
- Name: ${body.onboarding.name}
- Age: ${body.onboarding.age}
- Profession: ${body.onboarding.profession}
- Education: ${body.onboarding.education}
- Location: ${body.onboarding.location}
- Marital Status: ${body.onboarding.maritalStatus}
- Children: ${body.onboarding.hasChildren}
- Hobbies: ${body.onboarding.hobbies}
- Personal Goal: ${body.onboarding.personalGoal}
- Career Goal: ${body.onboarding.careerGoal}

## Blob Tree Assessment (Emotional Snapshot)
- Current self: Person #${body.blob_tree.current_blob} — "${body.blob_tree.current_title}"
  Traits: ${body.blob_tree.current_traits.join(', ')}
- Desired self: Person #${body.blob_tree.desired_blob} — "${body.blob_tree.desired_title}"
  Traits: ${body.blob_tree.desired_traits.join(', ')}

## Value Map Assessment (Core Values)
- Archetype: ${body.value_map.archetype}
- Top 5 Values (ranked): ${body.value_map.value_names.join(', ')}

Based on ALL this data, generate a Reality Report that:
1. Connects their emotional state (Blob Tree) with their values (Value Map) and life context
2. Identifies genuine strengths they can leverage
3. Names realistic constraints they need to work around
4. Highlights blind spots or risks
5. Articulates the growth direction — the gap between current and desired state
6. Provides one powerful key insight that ties everything together

Be specific and personal — reference their actual data, not generic advice.
Return ONLY valid JSON.`;

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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    let report;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      report = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      report = {
        headline: "Your Reality at a Glance",
        summary: "Based on your assessments, you show a clear direction for growth. Your emotional snapshot and core values reveal someone who is self-aware and ready for change.",
        strengths: ["Self-awareness", "Clear goal orientation", "Value-driven decision making"],
        constraints: ["Time and resource limitations", "Current role may not align with aspirations"],
        risks: ["Overthinking without action", "Setting expectations too high too fast"],
        growth_direction: "You're moving from awareness to action — the gap between where you are and where you want to be is bridgeable with structured effort.",
        key_insight: "Your values and emotional state are aligned in wanting growth, which is a strong foundation for change.",
      };
    }

    console.log("Reality report generated successfully");

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-reality-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
