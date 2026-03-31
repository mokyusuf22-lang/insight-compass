import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_name, themes, disc, values, wheel, blob, strengths } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Aura, a warm and insightful AI coaching guide. Based on the user's assessment results, provide a personalised recommendation paragraph (3-4 sentences) that:
1. Highlights their key strengths and areas for growth
2. Suggests what type of coach or mentor would best suit their needs
3. Explains why this match would be beneficial

Be specific, warm, and encouraging. Reference actual assessment data where possible. Respond with ONLY valid JSON: {"recommendation": "your text here"}`;

    const userPrompt = `User: ${user_name || 'Unknown'}

Identified Themes: ${JSON.stringify(themes || [])}

DISC Result: ${JSON.stringify(disc || 'Not completed')}

Core Values: ${JSON.stringify(values || 'Not completed')}

Wheel of Life Scores: ${JSON.stringify(wheel || 'Not completed')}

Blob Tree: ${JSON.stringify(blob || 'Not completed')}

Strengths: ${JSON.stringify(strengths || 'Not completed')}

Generate a personalised coaching recommendation based on these results.`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch {
      result = { recommendation: content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-coaching-recommendation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
