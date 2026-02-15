import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Brain,
  GitBranch,
  Building2,
  ChevronDown,
  RefreshCw,
  CalendarDays,
  DollarSign,
  Loader2,
  Sparkles,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import BacklogItem, {
  type BacklogItemStatus,
} from "@/components/backlog/BacklogItem";
import DependencyMap from "@/components/backlog/DependencyMap";

/* ── types ─────────────────────────────────────────── */

interface AssessmentScore {
  framework: string;
  score: number | null;
}

interface BusinessCtx {
  transformation_driver: string;
  target_date: string | null;
  budget_usd: number | null;
  hard_constraints: string[];
  additional_context: string | null;
}

interface Profile {
  company: string | null;
  full_name: string | null;
}

interface GeneratedAction {
  id: string;
  title: string;
  effort: number;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  owner: string;
  successMetric: string;
  dependencies: string[];
  aiContext: string;
  estimatedROI: {
    timeSavings: string;
    riskReduction: string;
    cost: string;
    payback: string;
  };
}

interface GeneratedSprint {
  number: number;
  timeline: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  budget: number;
  actions: GeneratedAction[];
}

interface BacklogData {
  sprints: GeneratedSprint[];
  deferredActions?: GeneratedAction[];
}

/* ── constants ─────────────────────────────────────── */

const frameworkLabels: Record<string, { label: string; icon: typeof Brain }> = {
  ai_readiness: { label: "AI Readiness", icon: Brain },
  devops: { label: "DevOps", icon: GitBranch },
  enterprise_operating_model: { label: "Operating Model", icon: Building2 },
};

const priorityStyles: Record<string, string> = {
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  LOW: "bg-muted text-muted-foreground border-border",
};

const quarterForSprint = (n: number) => {
  if (n <= 2) return "Q2 2026";
  if (n <= 4) return "Q3 2026";
  return "Q4 2026";
};

/* ── component ─────────────────────────────────────── */

export default function Backlog() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<AssessmentScore[]>([]);
  const [businessCtx, setBusinessCtx] = useState<BusinessCtx | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [backlogData, setBacklogData] = useState<BacklogData | null>(null);
  const [itemStatuses, setItemStatuses] = useState<Record<string, BacklogItemStatus>>({});
  const [openSprints, setOpenSprints] = useState<Record<number, boolean>>({ 1: true });

  /* ── load data ── */
  useEffect(() => {
    if (!user || !sessionId) return;

    const load = async () => {
      const [profileRes, scoresRes, ctxRes, backlogRes] = await Promise.all([
        supabase.from("profiles").select("company, full_name").eq("user_id", user.id).single(),
        supabase.from("assessments").select("framework, score").eq("user_id", user.id).eq("status", "completed"),
        supabase
          .from("business_context")
          .select("transformation_driver, target_date, budget_usd, hard_constraints, additional_context")
          .eq("assessment_id", sessionId)
          .limit(1),
        supabase
          .from("generated_backlogs" as any)
          .select("backlog_data")
          .eq("assessment_id", sessionId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (scoresRes.data) setScores(scoresRes.data as AssessmentScore[]);
      if (ctxRes.data && ctxRes.data.length > 0) setBusinessCtx(ctxRes.data[0] as unknown as BusinessCtx);
      if (backlogRes.data && (backlogRes.data as any[]).length > 0) {
        setBacklogData((backlogRes.data as any[])[0].backlog_data as BacklogData);
      }
      setLoading(false);
    };
    load();
  }, [user, sessionId]);

  /* ── helpers ── */
  const getScore = (fw: string) => {
    const found = scores.find((s) => s.framework === fw);
    return found?.score != null ? `${(found.score / 20).toFixed(1)}/5` : "—";
  };

  const getScoreNum = (fw: string): number => {
    const found = scores.find((s) => s.framework === fw);
    return found?.score != null ? found.score / 20 : 0;
  };

  const toggleSprint = (id: number) => {
    setOpenSprints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = (actionId: string, status: BacklogItemStatus) => {
    setItemStatuses((prev) => ({ ...prev, [actionId]: status }));
  };

  /* ── generate backlog ── */
  const generateBacklog = useCallback(async () => {
    if (!user || !sessionId || !businessCtx) return;
    setGenerating(true);

    try {
      const assessmentScores = {
        aiReadiness: { score: getScoreNum("ai_readiness") },
        devops: { score: getScoreNum("devops") },
        operatingModel: { score: getScoreNum("enterprise_operating_model") },
      };

      const bizCtx = {
        driver: businessCtx.transformation_driver,
        timeline: businessCtx.target_date
          ? format(new Date(businessCtx.target_date), "MMM yyyy")
          : "18 months",
        budget: businessCtx.budget_usd ?? 500000,
        constraints: businessCtx.hard_constraints ?? [],
        additionalContext: businessCtx.additional_context ?? undefined,
      };

      const { data, error } = await supabase.functions.invoke("generate-backlog", {
        body: { assessmentScores, businessContext: bizCtx },
      });

      if (error) throw error;

      const result = data as BacklogData;
      setBacklogData(result);
      setOpenSprints({ 1: true });
      setItemStatuses({});

      // persist
      await supabase.from("generated_backlogs" as any).insert({
        user_id: user.id,
        assessment_id: sessionId,
        backlog_data: result,
      } as any);

      toast({
        title: "Your transformation roadmap is ready!",
        description: `Generated ${result.sprints.length} sprints with ${result.sprints.reduce((a, s) => a + s.actions.length, 0)} action items.`,
      });
    } catch (err: any) {
      console.error("Generate backlog error:", err);
      toast({
        title: "Generation failed",
        description: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }, [user, sessionId, businessCtx, scores]);

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── group sprints by quarter ── */
  const sprintsByQuarter = backlogData
    ? backlogData.sprints.reduce<Record<string, GeneratedSprint[]>>((acc, sprint) => {
        const q = sprint.timeline || quarterForSprint(sprint.number);
        (acc[q] ??= []).push(sprint);
        return acc;
      }, {})
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard
            </Button>
            <span className="hidden sm:inline text-sm text-muted-foreground">/ Transformation Backlog</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-1.5 h-4 w-4" /> Download PDF
            </Button>
            {backlogData ? (
              <Button size="sm" onClick={generateBacklog} disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                )}
                Regenerate
              </Button>
            ) : (
              <Button size="sm" onClick={generateBacklog} disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                {generating ? "Generating…" : "Generate Backlog"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Generating overlay */}
      {generating && (
        <div className="container max-w-5xl py-8">
          <div className="flex flex-col items-center justify-center rounded-xl border bg-background p-16 text-center">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
            <h2 className="font-display text-xl font-bold">AI is analyzing your assessments…</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Building a prioritized transformation roadmap based on your scores and business context.
            </p>
          </div>
        </div>
      )}

      {!generating && (
        <main className="container max-w-5xl py-8">
          {/* Summary Header */}
          <div className="rounded-xl border bg-background p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {profile?.company || "Your Organization"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Transformation Backlog</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(["ai_readiness", "devops", "enterprise_operating_model"] as const).map((fw) => {
                    const meta = frameworkLabels[fw];
                    const Icon = meta.icon;
                    return (
                      <div key={fw} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{meta.label}:</span>
                        <span className="text-muted-foreground">{getScore(fw)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {businessCtx?.target_date && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Deadline</span>
                      <span className="font-medium">{format(new Date(businessCtx.target_date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                )}
                {businessCtx?.budget_usd != null && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Budget</span>
                      <span className="font-medium">${businessCtx.budget_usd.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {businessCtx?.transformation_driver && (
              <div className="mt-4 text-sm">
                <span className="text-muted-foreground">Driver:</span>{" "}
                <span className="font-medium">{businessCtx.transformation_driver}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sprints" className="mt-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sprints">90-Day Sprints</TabsTrigger>
              <TabsTrigger value="backlog">Full Backlog</TabsTrigger>
              <TabsTrigger value="dependencies">Dependency Map</TabsTrigger>
            </TabsList>

            {/* 90-Day Sprints */}
            <TabsContent value="sprints" className="mt-6 space-y-8">
              {!backlogData ? (
                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
                  Click <strong>"Generate Backlog"</strong> to create your prioritized transformation roadmap.
                </div>
              ) : (
                sprintsByQuarter &&
                Object.entries(sprintsByQuarter).map(([quarter, sprints]) => (
                  <div key={quarter}>
                    <h3 className="mb-3 font-display text-lg font-semibold">
                      Sprints {sprints[0].number}–{sprints[sprints.length - 1].number}{" "}
                      <span className="text-muted-foreground font-normal">({quarter})</span>
                    </h3>
                    <div className="space-y-3">
                      {sprints.map((sprint) => (
                        <Collapsible
                          key={sprint.number}
                          open={openSprints[sprint.number] || false}
                          onOpenChange={() => toggleSprint(sprint.number)}
                        >
                          <Card className="overflow-hidden">
                            <CollapsibleTrigger className="w-full text-left">
                              <CardHeader className="flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                                      openSprints[sprint.number] ? "rotate-0" : "-rotate-90"
                                    }`}
                                  />
                                  <div>
                                    <CardTitle className="text-sm font-semibold">
                                      Sprint {sprint.number} — {sprint.timeline}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {sprint.actions.length} action items · ${sprint.budget?.toLocaleString() ?? "—"}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold ${priorityStyles[sprint.priority]}`}
                                >
                                  {sprint.priority}
                                </Badge>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="border-t pt-4 pb-4 space-y-2">
                                {sprint.actions.map((action) => (
                                  <BacklogItem
                                    key={action.id}
                                    title={action.title}
                                    effort={action.effort}
                                    impact={action.impact}
                                    owner={action.owner}
                                    successMetric={action.successMetric}
                                    dependencies={action.dependencies}
                                    aiContext={action.aiContext}
                                    estimatedROI={action.estimatedROI}
                                    status={itemStatuses[action.id] ?? "todo"}
                                    onStatusChange={(s) => handleStatusChange(action.id, s)}
                                  />
                                ))}
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Full Backlog */}
            <TabsContent value="backlog" className="mt-6">
              {!backlogData ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
                  <RefreshCw className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="text-muted-foreground">Full backlog view will be populated after AI generation.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backlogData.sprints.flatMap((s) => s.actions).map((action) => (
                    <BacklogItem
                      key={action.id}
                      title={action.title}
                      effort={action.effort}
                      impact={action.impact}
                      owner={action.owner}
                      successMetric={action.successMetric}
                      dependencies={action.dependencies}
                      aiContext={action.aiContext}
                      estimatedROI={action.estimatedROI}
                      status={itemStatuses[action.id] ?? "todo"}
                      onStatusChange={(s) => handleStatusChange(action.id, s)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Dependency Map */}
            <TabsContent value="dependencies" className="mt-6">
              {!backlogData ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
                  <RefreshCw className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="text-muted-foreground">Dependency map will be generated alongside the backlog.</p>
                </div>
              ) : (
                <DependencyMap sprints={backlogData.sprints} />
              )}
            </TabsContent>
          </Tabs>
        </main>
      )}
    </div>
  );
}
