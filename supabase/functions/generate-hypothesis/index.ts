import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  axis_scores: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  derived_tendency: string;
  current_role: string;
  target_role: string;
  challenge: string;
  timeline: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log("Received request:", JSON.stringify(body));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert personality analyst and career assessment AI.

Your task is to generate an INITIAL personality hypothesis based on a short assessment.
This is not a final diagnosis.

You must:
- Infer likely MBTI tendencies (not a definitive type)
- Identify 2–4 dominant personality traits
- Use careful, non-absolute language
- Avoid psychological jargon
- Keep the tone professional, clear, and concise
- Avoid overconfidence

This assessment is used for career development and coaching.

You MUST respond with valid JSON only, no other text. The JSON must follow this exact structure:
{
  "mbti_tendency": "string (e.g., 'INTJ tendencies')",
  "traits": ["array of 2-4 trait strings"],
  "summary": "string (2-3 sentences explaining the personality profile)",
  "confidence": number (between 0.5 and 0.7)
}`;

    const userPrompt = `Here are the inputs from a short personality screener and career context.

MBTI Axis Scores (calculated from 20 questions, scale 0-20 per pole):
${JSON.stringify(body.axis_scores, null, 2)}

Derived tendency (preliminary): ${body.derived_tendency}

Career Context:
- Current role: ${body.current_role}
- Target role: ${body.target_role}
- Biggest challenge: ${body.challenge}
- Time horizon: ${body.timeline}

Based on this limited data, generate an INITIAL personality profile hypothesis.

Use the axis scores as the primary signal. Higher scores indicate stronger preference for that pole.
Use the career context to refine interpretation.
Do NOT contradict the scoring.
Use cautious language such as "tendencies" or "likely preferences."

Return ONLY valid JSON with this structure:
{
  "mbti_tendency": "string",
  "traits": ["trait1", "trait2", "trait3"],
  "summary": "string",
  "confidence": number
}`;

    console.log("Calling Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
    console.log("AI response:", JSON.stringify(aiResponse));

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response - handle potential markdown wrapping
    let hypothesis;
    try {
      // Try to extract JSON from potential markdown code blocks
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      hypothesis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Provide a fallback based on the scores
      hypothesis = {
        mbti_tendency: `${body.derived_tendency} tendencies`,
        traits: ["Analytical", "Goal-oriented", "Adaptable"],
        summary: "Based on your responses, you show preferences in how you process information and make decisions. This initial hypothesis will be refined in the next phase of the assessment.",
        confidence: 0.6,
      };
    }

    // Validate and clamp confidence
    if (typeof hypothesis.confidence !== "number" || hypothesis.confidence < 0.5 || hypothesis.confidence > 0.7) {
      hypothesis.confidence = 0.6;
    }

    console.log("Returning hypothesis:", JSON.stringify(hypothesis));

    return new Response(JSON.stringify(hypothesis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-hypothesis:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
