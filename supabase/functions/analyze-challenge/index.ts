import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Aura", a warm, empathetic AI coaching guide. Your role is to deeply understand a user's needs from their free-text description.

Analyse the user's input and:
1. Identify 2-4 primary focus areas from: Career, Life Balance, Relationships, Finance, Personal Growth, Health & Wellbeing, Education & Skills, Leadership, Confidence & Self-Esteem, Time Management, Family, Creativity
2. Provide a warm, conversational summary of your understanding (2-3 sentences, written as if speaking directly to them)
3. For each theme, give a brief explanation of why you identified it

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Your conversational summary here...",
  "themes": [
    { "area": "Theme Name", "confidence": 0.9, "explanation": "Why you identified this" }
  ]
}

Rules:
- Keep the summary warm, empathetic, and human
- Reference specific things the user mentioned
- Confidence should be 0.0-1.0
- Order themes by confidence (highest first)
- Maximum 4 themes`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { challenge_text, user_name } = await req.json();

    if (!challenge_text || challenge_text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Please provide more detail about your needs." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = user_name
      ? `The user's name is ${user_name}. Here is what they shared:\n\n"${challenge_text}"`
      : `Here is what the user shared:\n\n"${challenge_text}"`;

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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = {
        summary: "Thank you for sharing. I can see you have important goals you'd like to work toward. Let me help you explore these further.",
        themes: [{ area: "Personal Growth", confidence: 0.7, explanation: "Based on your desire for positive change." }],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-challenge error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
