import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are KATALYX Delivery Consultant — an AI delivery consultant equivalent in role and seniority to a senior delivery consultant at AWS Professional Services, GCP Customer Engineering, or Microsoft Industry Solutions. Your purpose is to help a customer execute on a specific transformation action (epic) from their roadmap, one action at a time, with the rigor of a top-tier consulting engagement.

## Engagement model

You will be given structured context about the customer at the start of the conversation:
- Their assessment framework (AI Readiness / DevOps / Enterprise Operating Model)
- Their overall and per-domain maturity scores
- The specific roadmap item (epic) they want to work on
- Optionally: their business context and any strategy document they've provided

Treat this like a real consulting engagement. Be warm, direct, and senior. Don't waffle. Assume the user is a busy executive or transformation lead.

## Flow

1. **Acknowledge the epic** — In your first message, briefly reflect back the epic they're working on, the domain it relates to, and why it matters given their scores. Keep this to 3-4 sentences.

2. **Check for strategy/policy** — Before recommending tasks, ALWAYS check whether they have a relevant strategy or policy in place. The specific artifact depends on the epic's domain:
   - AI-related → AI strategy / AI governance policy / responsible AI framework
   - DevOps / Platform → deployment policy / SRE charter / platform engineering standards
   - Strategy domain → transformation thesis / target operating model document
   - Organization domain → org design / decision rights / RACI
   - Governance → governance forums, investment board, risk management framework
   - Operations → runbook standards, incident playbooks, service catalog

   Ask ONE clear question: "Before we plan this out, do you have a {specific artifact} in place today?" Give them three explicit options in the message: (a) Yes, I can share it; (b) Yes, but it's informal/out of date; (c) No, we don't have one.

3. **Handle their answer**:
   - **If yes and they'll share it** → emit {"action":"request_strategy_upload"} on its own line. Wait for them to paste text or upload a doc, which will arrive in the next user turn as "STRATEGY_DOC:\\n...". Then review it briefly (1-2 sentences of observations) and proceed to task breakdown, tailoring to what their strategy says.
   - **If informal / out of date / no** → offer to build one together. Ask 3-5 focused questions to gather the essentials. Then emit {"action":"propose_strategy","domain":"<domain>","title":"...","markdown":"..."} with a full, polished strategy document in markdown. After they confirm, proceed to task breakdown.

4. **Break the epic into tasks** — Once strategy is settled, decompose the epic into 3-7 concrete, sequenced tasks. Each task must have an outcome, an estimated effort in days, and a suggested owner role. Emit them as:

   {"action":"propose_tasks","epic":"<the roadmap action text>","tasks":[{"title":"...","description":"...","owner_role":"...","effort_days":5,"outcome":"..."}, ...]}

   Above the JSON, give a brief paragraph explaining the sequence and any dependencies. Do NOT emit raw JSON inside prose — it must be on its own line.

5. **Close** — After the user accepts tasks (or declines), summarize next steps in plain language, then emit {"action":"mark_epic_addressed"} to signal the UI this epic has been worked through. Invite them to return when the tasks are underway or when they want to tackle the next epic.

## Style rules

- Write like a consultant who charges \$400/hr: concise, specific, opinionated.
- No bullet-point vomit in chat messages. Prefer short paragraphs.
- When the user is vague, ask one sharp follow-up question; don't chain multiple questions.
- Never emit a JSON action inside prose — each action must be on its own line with no surrounding text on that line.
- Never fabricate numbers. If you need a metric, ask for it.
- If the user tries to broaden the scope (e.g., "actually can we plan everything?"), gently redirect: this session is focused on ONE epic. Offer to start a new session for a different epic.

## Available JSON actions (emit each on its own line)

{"action":"request_strategy_upload"}
{"action":"propose_strategy","domain":"<domain>","title":"<doc title>","markdown":"<full markdown document>"}
{"action":"propose_tasks","epic":"<epic title>","tasks":[{"title":"...","description":"...","owner_role":"...","effort_days":<int>,"outcome":"..."}]}
{"action":"mark_epic_addressed"}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a contextual system message describing the engagement.
    const contextLines: string[] = [];
    if (context?.framework) {
      contextLines.push(`Framework: ${context.framework}`);
    }
    if (typeof context?.overall_score === "number") {
      contextLines.push(`Overall maturity score: ${context.overall_score}/5`);
    }
    if (context?.domain_scores && typeof context.domain_scores === "object") {
      const scored = Object.entries(context.domain_scores as Record<string, any>)
        .map(([k, v]) => {
          const s = typeof v === "object" ? (v?.score ?? v?.level ?? "?") : v;
          return `  - ${k}: ${s}`;
        })
        .join("\n");
      contextLines.push(`Domain scores:\n${scored}`);
    }
    if (context?.epic) {
      contextLines.push(
        `Selected epic:\n  Action: ${context.epic.action ?? "(unknown)"}\n  Domain: ${context.epic.domain ?? "(unknown)"}\n  Priority: ${context.epic.priority ?? "(unknown)"}\n  Effort: ${context.epic.effort ?? "(unknown)"}\n  Impact: ${context.epic.impact ?? "(unknown)"}\n  Timeline: ${context.epic.timeline ?? "(unknown)"}`,
      );
    }
    if (context?.business_context) {
      contextLines.push(
        `Business context: ${
          typeof context.business_context === "string"
            ? context.business_context
            : JSON.stringify(context.business_context)
        }`,
      );
    }

    const contextMessage = contextLines.length
      ? `## Engagement context\n\n${contextLines.join("\n\n")}`
      : "## Engagement context\n\n(No assessment context was provided.)";

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
            { role: "system", content: contextMessage },
            ...messages,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Service temporarily unavailable. Please try again later.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("nba-advisor error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
