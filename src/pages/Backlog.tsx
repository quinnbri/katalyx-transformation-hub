import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import { format } from "date-fns";

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

interface Sprint {
  id: number;
  title: string;
  timeline: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  budgetAllocation: string;
  items: string[];
}

const placeholderSprints: { quarter: string; sprints: Sprint[] }[] = [
  {
    quarter: "Q2 2026",
    sprints: [
      { id: 1, title: "Sprint 1 — Foundation", timeline: "Apr 1 – Apr 14", priority: "CRITICAL", budgetAllocation: "—", items: [] },
      { id: 2, title: "Sprint 2 — Quick Wins", timeline: "Apr 15 – Apr 28", priority: "HIGH", budgetAllocation: "—", items: [] },
      { id: 3, title: "Sprint 3 — Platform Prep", timeline: "Apr 29 – May 12", priority: "HIGH", budgetAllocation: "—", items: [] },
    ],
  },
  {
    quarter: "Q3 2026",
    sprints: [
      { id: 4, title: "Sprint 4 — Core Migration", timeline: "Jul 1 – Jul 14", priority: "HIGH", budgetAllocation: "—", items: [] },
      { id: 5, title: "Sprint 5 — Integration", timeline: "Jul 15 – Jul 28", priority: "MEDIUM", budgetAllocation: "—", items: [] },
      { id: 6, title: "Sprint 6 — Testing & Hardening", timeline: "Jul 29 – Aug 11", priority: "MEDIUM", budgetAllocation: "—", items: [] },
    ],
  },
  {
    quarter: "Q4 2026",
    sprints: [
      { id: 7, title: "Sprint 7 — Scale & Optimize", timeline: "Oct 1 – Oct 14", priority: "MEDIUM", budgetAllocation: "—", items: [] },
      { id: 8, title: "Sprint 8 — Governance", timeline: "Oct 15 – Oct 28", priority: "LOW", budgetAllocation: "—", items: [] },
      { id: 9, title: "Sprint 9 — Continuous Improvement", timeline: "Oct 29 – Nov 11", priority: "LOW", budgetAllocation: "—", items: [] },
    ],
  },
];

export default function Backlog() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<AssessmentScore[]>([]);
  const [businessCtx, setBusinessCtx] = useState<BusinessCtx | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSprints, setOpenSprints] = useState<Record<number, boolean>>({ 1: true });

  useEffect(() => {
    if (!user || !sessionId) return;

    const load = async () => {
      const [profileRes, scoresRes, ctxRes] = await Promise.all([
        supabase.from("profiles").select("company, full_name").eq("user_id", user.id).single(),
        supabase.from("assessments").select("framework, score").eq("user_id", user.id).eq("status", "completed"),
        supabase
          .from("business_context")
          .select("transformation_driver, target_date, budget_usd, hard_constraints, additional_context")
          .eq("assessment_id", sessionId)
          .limit(1),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (scoresRes.data) setScores(scoresRes.data as AssessmentScore[]);
      if (ctxRes.data && ctxRes.data.length > 0) setBusinessCtx(ctxRes.data[0] as unknown as BusinessCtx);

      setLoading(false);
    };
    load();
  }, [user, sessionId]);

  const getScore = (fw: string) => {
    const found = scores.find((s) => s.framework === fw);
    return found?.score != null ? `${(found.score / 20).toFixed(1)}/5` : "—";
  };

  const toggleSprint = (id: number) => {
    setOpenSprints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="outline" size="sm" disabled>
            <Sparkles className="mr-1.5 h-4 w-4" /> Generate Backlog
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl py-8">
        {/* ── Summary Header ────────────────────────────── */}
        <div className="rounded-xl border bg-background p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Left: org + scores */}
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
                    <div
                      key={fw}
                      className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{meta.label}:</span>
                      <span className="text-muted-foreground">{getScore(fw)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: timeline + budget */}
            <div className="flex flex-wrap gap-4 text-sm">
              {businessCtx?.target_date && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground block">Deadline</span>
                    <span className="font-medium">
                      {format(new Date(businessCtx.target_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              )}
              {businessCtx?.budget_usd != null && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground block">Budget</span>
                    <span className="font-medium">
                      ${businessCtx.budget_usd.toLocaleString()}
                    </span>
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

        {/* ── Tabs ───────────────────────────────────────── */}
        <Tabs defaultValue="sprints" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sprints">90-Day Sprints</TabsTrigger>
            <TabsTrigger value="backlog">Full Backlog</TabsTrigger>
            <TabsTrigger value="dependencies">Dependency Map</TabsTrigger>
          </TabsList>

          {/* ── 90-Day Sprints ─────────────────────────── */}
          <TabsContent value="sprints" className="mt-6 space-y-8">
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
              Click <strong>"Generate Backlog"</strong> to create your prioritized transformation roadmap.
            </div>

            {placeholderSprints.map((quarter) => (
              <div key={quarter.quarter}>
                <h3 className="mb-3 font-display text-lg font-semibold">
                  Sprints {quarter.sprints[0].id}–{quarter.sprints[quarter.sprints.length - 1].id}{" "}
                  <span className="text-muted-foreground font-normal">({quarter.quarter})</span>
                </h3>

                <div className="space-y-3">
                  {quarter.sprints.map((sprint) => (
                    <Collapsible
                      key={sprint.id}
                      open={openSprints[sprint.id] || false}
                      onOpenChange={() => toggleSprint(sprint.id)}
                    >
                      <Card className="overflow-hidden">
                        <CollapsibleTrigger className="w-full text-left">
                          <CardHeader className="flex flex-row items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                  openSprints[sprint.id] ? "rotate-0" : "-rotate-90"
                                }`}
                              />
                              <div>
                                <CardTitle className="text-sm font-semibold">{sprint.title}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">{sprint.timeline}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${priorityStyles[sprint.priority]}`}
                              >
                                {sprint.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{sprint.budgetAllocation}</span>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="border-t pt-4 pb-4">
                            {sprint.items.length > 0 ? (
                              <ul className="space-y-2 text-sm">
                                {sprint.items.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Backlog items will appear here after generation.
                              </p>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── Full Backlog ───────────────────────────── */}
          <TabsContent value="backlog" className="mt-6">
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
              <RefreshCw className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-muted-foreground">
                Full backlog view will be populated after AI generation.
              </p>
            </div>
          </TabsContent>

          {/* ── Dependency Map ─────────────────────────── */}
          <TabsContent value="dependencies" className="mt-6">
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
              <RefreshCw className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-muted-foreground">
                Dependency map will be generated alongside the backlog.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
