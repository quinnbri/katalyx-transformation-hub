import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to insert variants (public table but no INSERT policy for anon)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { framework, variants_per_question = 3 } = body;

    if (!framework) {
      return new Response(JSON.stringify({ error: "framework is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template questions
    const { data: questions, error: qErr } = await serviceClient
      .from("assessment_questions")
      .select("*")
      .eq("framework", framework)
      .order("sort_order");

    if (qErr || !questions?.length) {
      return new Response(JSON.stringify({ error: "No questions found for framework" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results: { question_id: string; variants_created: number }[] = [];

    // Process in batches of 5 questions to stay within rate limits
    for (let i = 0; i < questions.length; i += 5) {
      const batch = questions.slice(i, i + 5);

      const batchPromises = batch.map(async (q: any) => {
        // Check existing variants
        const { count } = await serviceClient
          .from("question_variants")
          .select("*", { count: "exact", head: true })
          .eq("template_question_id", q.id);

        if ((count ?? 0) >= variants_per_question) {
          results.push({ question_id: q.id, variants_created: 0 });
          return;
        }

        const needed = variants_per_question - (count ?? 0);
        const startNum = (count ?? 0) + 1;

        const prompt = `You are rewriting a maturity assessment question into ${needed} DIFFERENT scenario-based variants.

ORIGINAL QUESTION: "${q.original_question_text || q.question_text}"
DOMAIN: ${q.domain}
FRAMEWORK: ${q.framework}

The original has 5 maturity levels. Each variant must:
1. Present a DIFFERENT realistic workplace scenario (2-3 sentences) that tests the SAME underlying capability
2. Have 5 response options that describe observable behaviors at each maturity level
3. NOT use words like "maturity", "level 1-5", "basic/advanced" — describe what organizations actually DO
4. Each variant must use a COMPLETELY DIFFERENT scenario setting (e.g., one about a team meeting, another about a crisis, another about a new hire's experience)
5. Options should be shuffled in terms of writing style — don't always follow the same pattern

Return a JSON array of ${needed} objects:
[{
  "scenario_context": "The workplace scenario description...",
  "question_text": "The question asked about this scenario...",
  "option_descriptions": ["behavior at level 1", "behavior at level 2", "behavior at level 3", "behavior at level 4", "behavior at level 5"]
}]

Return ONLY valid JSON, no markdown.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        });

        if (!aiResp.ok) {
          console.error(`AI error for question ${q.id}:`, aiResp.status);
          results.push({ question_id: q.id, variants_created: 0 });
          return;
        }

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content;
        let variants;
        try {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          variants = JSON.parse(cleaned);
        } catch {
          console.error(`Failed to parse variants for ${q.id}:`, content?.slice(0, 200));
          results.push({ question_id: q.id, variants_created: 0 });
          return;
        }

        const rows = variants.slice(0, needed)
          .filter((v: any) => v.scenario_context && v.question_text && Array.isArray(v.option_descriptions) && v.option_descriptions.length === 5)
          .map((v: any, idx: number) => ({
            template_question_id: q.id,
            variant_number: startNum + idx,
            scenario_context: String(v.scenario_context),
            question_text: String(v.question_text),
            option_descriptions: v.option_descriptions.map((d: any) => String(d)),
          }));

        if (rows.length === 0) {
          console.error(`No valid variants produced for ${q.id}`);
          results.push({ question_id: q.id, variants_created: 0 });
          return;
        }

        const { error: insertErr } = await serviceClient
          .from("question_variants")
          .insert(rows);

        if (insertErr) {
          console.error(`Insert error for ${q.id}:`, insertErr);
          results.push({ question_id: q.id, variants_created: 0 });
        } else {
          results.push({ question_id: q.id, variants_created: rows.length });
        }
      });

      await Promise.all(batchPromises);
      // Small delay between batches to respect rate limits
      if (i + 5 < questions.length) await new Promise(r => setTimeout(r, 1000));
    }

    const totalCreated = results.reduce((s, r) => s + r.variants_created, 0);
    return new Response(JSON.stringify({
      framework,
      total_questions: questions.length,
      total_variants_created: totalCreated,
      details: results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("generate-variants error:", e);
    return new Response(JSON.stringify({ error: "Failed to generate variants" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
