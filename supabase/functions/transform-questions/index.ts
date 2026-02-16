import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { framework, domain } = await req.json();
    if (!framework || !domain) throw new Error("framework and domain are required");

    // Fetch questions for this specific domain
    const { data: questions, error: qErr } = await supabase
      .from("assessment_questions")
      .select("id, question_text, domain, options, sort_order, question_format, original_question_text")
      .eq("framework", framework)
      .eq("domain", domain)
      .order("sort_order");

    if (qErr) throw qErr;
    if (!questions || questions.length === 0) throw new Error("No questions found");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an expert organizational assessment designer. Transform these direct maturity-scale questions into scenario-based questions that measure the SAME maturity dimensions but are much harder to copy or reverse-engineer.

FRAMEWORK: ${framework}
DOMAIN: ${domain}

CURRENT QUESTIONS:
${questions.map((q: any, i: number) => `
Q${i + 1} (id: ${q.id}): "${q.question_text}"
Options (1-5): ${q.options?.labels?.join(", ")}
Descriptions: ${q.options?.descriptions?.join(" | ")}
`).join("\n")}

TRANSFORMATION RULES:
1. Each question becomes a SCENARIO: a realistic workplace situation (2-3 sentences) that an executive or tech leader would recognize.
2. The scenario should describe a specific event, decision point, or organizational moment — NOT ask about maturity directly.
3. The 5 response options should describe BEHAVIORS or OUTCOMES at each maturity level, WITHOUT labeling them as levels.
4. Options should read as "What happens next" — behavioral descriptions, not maturity labels.
5. Each option should be 1-2 sentences describing a realistic organizational behavior.
6. Options must map to maturity levels 1 (lowest) to 5 (highest) in order, but this should NOT be obvious.
7. Make scenarios specific enough to feel proprietary — reference realistic situations, team dynamics, tool categories.
8. Write a short scenario_context (the situation setup, 2-3 sentences) and a question_text (the actual question, 1 sentence).

Return JSON:
{
  "questions": [
    {
      "original_id": "uuid from above",
      "scenario_context": "situation setup...",
      "question_text": "Which best describes how your organization would handle this?",
      "labels": ["Option A", "Option B", "Option C", "Option D", "Option E"],
      "descriptions": ["behavior 1", "behavior 2", "behavior 3", "behavior 4", "behavior 5"]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a senior organizational psychologist designing proprietary assessment instruments. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI error:`, response.status, errText);
      if (response.status === 429) throw new Error("Rate limited — please try again in a moment");
      if (response.status === 402) throw new Error("AI credits exhausted — please add credits");
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Parse failed:", content.substring(0, 500));
      throw new Error("Failed to parse AI response");
    }

    const scenarioQuestions = parsed.questions || parsed;
    let updated = 0;

    for (const sq of scenarioQuestions) {
      const original = questions.find((q: any) => q.id === sq.original_id);
      if (!original) continue;

      const { error: upErr } = await supabase
        .from("assessment_questions")
        .update({
          original_question_text: (original as any).original_question_text || (original as any).question_text,
          question_text: sq.question_text,
          scenario_context: sq.scenario_context,
          question_format: "scenario",
          options: {
            min: 1,
            max: 5,
            labels: sq.labels,
            descriptions: sq.descriptions,
          },
        })
        .eq("id", original.id);

      if (upErr) console.error("Update error:", original.id, upErr);
      else updated++;
    }

    return new Response(
      JSON.stringify({ success: true, transformed: updated, total: questions.length, domain }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("transform-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
