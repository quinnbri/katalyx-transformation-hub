import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── prompt helpers (mirror of src/lib/prompts/backlog-generator.ts) ── */

function maturityLevel(score: number): string {
  if (score >= 4.5) return "Optimizing";
  if (score >= 3.5) return "Managed";
  if (score >= 2.5) return "Defined";
  if (score >= 1.5) return "Developing";
  return "Initial";
}

function formatDomainScores(label: string, domains?: Record<string, number>): string {
  if (!domains || Object.keys(domains).length === 0) return "";
  const lines = Object.entries(domains)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => `    - ${name}: ${score.toFixed(1)}/5`);
  return `  ${label} domain breakdown (lowest first):\n${lines.join("\n")}`;
}

const driverGuidance: Record<string, string> = {
  "datacenter exit":
    "CRITICAL: Prioritize cloud migration and infrastructure work BEFORE transformation initiatives.",
  "regulatory compliance":
    "CRITICAL: Prioritize governance, security, and audit-readiness BEFORE velocity improvements.",
  "cost optimization":
    "Focus on quick wins that reduce run-rate costs early then structural changes.",
  "digital transformation":
    "Balance innovation initiatives with foundational capability building.",
  "m&a integration":
    "Prioritize system consolidation, identity unification, and data migration.",
};

interface AssessmentScores {
  aiReadiness: { score: number; domainScores?: Record<string, number> };
  devops: { score: number; domainScores?: Record<string, number> };
  operatingModel: { score: number; domainScores?: Record<string, number> };
}

interface BusinessCtx {
  driver: string;
  timeline: string;
  budget: number;
  constraints: string[];
  additionalContext?: string;
}

function buildPrompt(assessment: AssessmentScores, ctx: BusinessCtx): string {
  const ai = assessment.aiReadiness.score;
  const dv = assessment.devops.score;
  const om = assessment.operatingModel.score;

  const guidance =
    Object.entries(driverGuidance).find(([k]) =>
      ctx.driver.toLowerCase().includes(k)
    )?.[1] ?? "";

  const detailed = [
    formatDomainScores("AI Readiness", assessment.aiReadiness.domainScores),
    formatDomainScores("DevOps / DORA", assessment.devops.domainScores),
    formatDomainScores("Operating Model", assessment.operatingModel.domainScores),
  ]
    .filter(Boolean)
    .join("\n\n");

  return `You are a transformation consultant generating a prioritized transformation backlog.

ASSESSMENT RESULTS:
- AI Readiness: ${ai.toFixed(1)}/5 — ${maturityLevel(ai)}
- DevOps / DORA: ${dv.toFixed(1)}/5 — ${maturityLevel(dv)}
- Operating Model: ${om.toFixed(1)}/5 — ${maturityLevel(om)}

BUSINESS CONTEXT:
- Primary Driver: ${ctx.driver}
- Timeline: ${ctx.timeline}
- Budget: $${ctx.budget.toLocaleString()}
- Constraints: ${ctx.constraints.length > 0 ? ctx.constraints.join("; ") : "None specified"}${ctx.additionalContext ? `\n- Additional Context: ${ctx.additionalContext}` : ""}

${detailed ? `DETAILED ASSESSMENT DATA:\n${detailed}\n` : ""}${guidance ? `DRIVER-SPECIFIC GUIDANCE:\n${guidance}\n` : ""}
TASK:
Generate a prioritized transformation backlog structured as 6 sprints (90 days each, 18 months total).
For each sprint provide 3-5 high-impact actions.

For EACH action item provide:
- id: Unique identifier (e.g. "action_1")
- title: Clear, actionable title
- effort: Estimated hours (number)
- impact: CRITICAL | HIGH | MEDIUM | LOW
- owner: Suggested role or team
- successMetric: Measurable outcome
- dependencies: Array of other action IDs this depends on
- aiContext: 2-3 sentences explaining WHY this matters
- estimatedROI: { timeSavings: string, riskReduction: string, cost: string, payback: string }

Return ONLY valid JSON:
{
  "sprints": [
    {
      "number": 1,
      "timeline": "Q2 2026",
      "priority": "CRITICAL",
      "budget": 400000,
      "actions": [ { "id":"action_1","title":"...","effort":40,"impact":"HIGH","owner":"...","successMetric":"...","dependencies":[],"aiContext":"...","estimatedROI":{"timeSavings":"...","riskReduction":"...","cost":"...","payback":"..."} } ]
    }
  ],
  "deferredActions": []
}`;
}

/* ── handler ── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentScores, businessContext } = await req.json() as {
      assessmentScores: AssessmentScores;
      businessContext: BusinessCtx;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = buildPrompt(assessmentScores, businessContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a transformation consultant. Return ONLY valid JSON, no markdown fences." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response. Please retry." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-backlog error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
