import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RequestSchema = z.object({
  framework: z.string().min(1).max(100),
  domains: z.array(z.string().min(1).max(100)).min(1).max(20),
  responses: z.array(z.object({
    domain: z.string().min(1).max(200),
    question: z.string().min(1).max(500),
    answer: z.union([z.number().int().min(1).max(5), z.null()]),
    label: z.string().max(200).optional(),
  })).min(1).max(200),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const body = await req.json();
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { framework, domains, responses } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert digital transformation consultant with 15+ years of experience. You are analyzing assessment results for the "${framework}" framework.

The user answered questions across these domains: ${domains.join(", ")}.

Provide a comprehensive analysis in the following JSON structure:
{
  "overall_score": <number 0-100>,
  "domain_scores": {
    "<domain_name>": {
      "score": <number 0-100>,
      "level": "<Beginner|Developing|Defined|Advanced|Leading>",
      "strengths": ["<strength1>", "<strength2>"],
      "gaps": ["<gap1>", "<gap2>"]
    }
  },
  "summary": "<2-3 paragraph executive summary>",
  "roadmap": [
    {
      "priority": <1-10>,
      "action": "<specific action>",
      "domain": "<domain>",
      "effort": "<Low|Medium|High>",
      "impact": "<Low|Medium|High>",
      "timeline": "<1-3 months|3-6 months|6-12 months>"
    }
  ]
}

Score interpretation: 1=lowest maturity, 5=highest maturity per question.
Return ONLY valid JSON, no markdown.`;

    const userPrompt = `Here are the assessment responses:\n${JSON.stringify(responses, null, 2)}`;

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
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Unable to generate assessment results. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from the response (handle potential markdown wrapping)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Unable to process assessment results. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-results error:", e);
    return new Response(JSON.stringify({ error: "Unable to generate assessment results. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
