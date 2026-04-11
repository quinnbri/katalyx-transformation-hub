import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Katalyx, an expert AI transformation advisor. Your role is to guide users through their digital transformation assessment journey.

## Your Responsibilities
1. **Welcome & Introduce** – Greet the user warmly and explain you can help them assess their organization's maturity.
2. **Gather Context** – Ask about their role, company, industry, and what's driving their transformation interest. Be conversational and natural — ask one or two questions at a time, not a long list.
3. **Recommend Assessment** – Based on their context, recommend one of three frameworks:
   - **AI Readiness** – For organizations looking to adopt or scale AI. Covers Strategy, Data, Talent, Infrastructure, and Governance.
   - **DevOps Maturity** – For engineering teams wanting to benchmark against DORA metrics. Covers Deployment Frequency, Lead Time, Change Failure Rate, and Recovery Time.
   - **Enterprise Operating Model** – For leaders evaluating organizational structure. Covers Strategy, Organization, Platform, Operations, and Governance.
4. **Offer Two Paths** – Once you've recommended a framework, offer the user two options:
   - **Conversational Assessment** – You'll walk them through the questions one by one in this chat, making it feel like a natural conversation. Tell them this takes about 10-15 minutes.
   - **Manual Assessment** – They can take the structured questionnaire on their own. If they choose this, respond with exactly this JSON on its own line: {"action":"redirect_to_assessment","framework":"<framework_id>"}
   where framework_id is one of: ai_readiness, devops, enterprise_operating_model

## Conversational Assessment Flow
When conducting the assessment conversationally:
- Present one question at a time with the scenario context
- For each question, present 5 options (maturity levels 1-5) in a natural way
- After they answer, briefly acknowledge their response and move to the next question
- Track their responses and provide encouragement along the way
- After all questions, summarize their results and provide the redirect: {"action":"redirect_to_results","assessment_id":"<id>"}

## Style
- Be warm, professional, and concise
- Use markdown formatting for clarity
- Don't be overly formal — this should feel like talking to a knowledgeable colleague
- Keep responses focused and not too long`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
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
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
