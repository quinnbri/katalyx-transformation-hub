export interface AssessmentData {
  aiReadiness: { score: number; domainScores?: Record<string, number> };
  devops: { score: number; domainScores?: Record<string, number> };
  operatingModel: { score: number; domainScores?: Record<string, number> };
}

export interface BusinessContext {
  driver: string;
  timeline: string;
  budget: number;
  constraints: string[];
  additionalContext?: string;
}

const maturityLevel = (score: number): string => {
  if (score >= 4.5) return "Optimizing";
  if (score >= 3.5) return "Managed";
  if (score >= 2.5) return "Defined";
  if (score >= 1.5) return "Developing";
  return "Initial";
};

const formatDomainScores = (label: string, domains?: Record<string, number>): string => {
  if (!domains || Object.keys(domains).length === 0) return "";
  const lines = Object.entries(domains)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => `    - ${name}: ${score.toFixed(1)}/5`);
  return `  ${label} domain breakdown (lowest first):\n${lines.join("\n")}`;
};

const driverGuidance: Record<string, string> = {
  "Datacenter exit":
    "CRITICAL: Prioritize cloud migration and infrastructure work BEFORE transformation initiatives. Early sprints must focus on lift-and-shift, networking, and hybrid connectivity.",
  "Regulatory compliance":
    "CRITICAL: Prioritize governance, security, and audit-readiness BEFORE velocity improvements. Compliance gaps must be closed in the first two sprints.",
  "Cost optimization":
    "Focus on quick wins that reduce run-rate costs early (right-sizing, license consolidation) then structural changes.",
  "Digital transformation":
    "Balance innovation initiatives with foundational capability building. Ensure platform readiness before scaling digital products.",
  "M&A integration":
    "Prioritize system consolidation, identity unification, and data migration. Minimize disruption to both legacy environments.",
};

export function generateBacklogPrompt(
  assessment: AssessmentData,
  context: BusinessContext
): string {
  const aiScore = assessment.aiReadiness.score;
  const devopsScore = assessment.devops.score;
  const omScore = assessment.operatingModel.score;

  const guidance =
    Object.entries(driverGuidance).find(([key]) =>
      context.driver.toLowerCase().includes(key.toLowerCase())
    )?.[1] ?? "";

  const detailedScores = [
    formatDomainScores("AI Readiness", assessment.aiReadiness.domainScores),
    formatDomainScores("DevOps / DORA", assessment.devops.domainScores),
    formatDomainScores("Operating Model", assessment.operatingModel.domainScores),
  ]
    .filter(Boolean)
    .join("\n\n");

  return `You are a transformation consultant generating a prioritized transformation backlog.

ASSESSMENT RESULTS:
- AI Readiness: ${aiScore.toFixed(1)}/5 — ${maturityLevel(aiScore)}
- DevOps / DORA: ${devopsScore.toFixed(1)}/5 — ${maturityLevel(devopsScore)}
- Operating Model: ${omScore.toFixed(1)}/5 — ${maturityLevel(omScore)}

BUSINESS CONTEXT:
- Primary Driver: ${context.driver}
- Timeline: ${context.timeline}
- Budget: $${context.budget.toLocaleString()}
- Constraints: ${context.constraints.length > 0 ? context.constraints.join("; ") : "None specified"}${context.additionalContext ? `\n- Additional Context: ${context.additionalContext}` : ""}

${detailedScores ? `DETAILED ASSESSMENT DATA:\n${detailedScores}\n` : ""}${guidance ? `DRIVER-SPECIFIC GUIDANCE:\n${guidance}\n` : ""}
TASK:
Generate a prioritized transformation backlog structured as 6 sprints (90 days each, 18 months total).

For each sprint, provide 3-5 high-impact actions that:
1. Address the lowest-scoring assessment areas first
2. Respect the business constraints and budget ($${context.budget.toLocaleString()} total)
3. Follow logical dependencies (foundational work before advanced initiatives)
4. Align with the primary transformation driver: "${context.driver}"

For EACH action item, provide:
- id: Unique identifier (e.g. "action_1")
- title: Clear, actionable title
- effort: Estimated hours
- impact: CRITICAL | HIGH | MEDIUM | LOW
- owner: Suggested role or team
- successMetric: Measurable outcome
- dependencies: Array of other action IDs this depends on
- aiContext: 2-3 sentences explaining WHY this matters given their specific scores and context
- estimatedROI: { timeSavings: string, riskReduction: string, cost: string, payback: string }

Return ONLY valid JSON in this exact format:
{
  "sprints": [
    {
      "number": 1,
      "timeline": "Q2 2026",
      "priority": "CRITICAL",
      "budget": 400000,
      "actions": [
        {
          "id": "action_1",
          "title": "...",
          "effort": 40,
          "impact": "HIGH",
          "owner": "...",
          "successMetric": "...",
          "dependencies": [],
          "aiContext": "...",
          "estimatedROI": { "timeSavings": "...", "riskReduction": "...", "cost": "...", "payback": "..." }
        }
      ]
    }
  ],
  "deferredActions": []
}`;
}
