import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Brain, GitBranch, Building2, Eye, LogOut } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const frameworkDefs: Record<string, {
  id: string;
  title: string;
  description: string;
  details: string;
  domains: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  ai_readiness: {
    id: "ai_readiness",
    title: "AI Readiness",
    description: "Assess how prepared your org is to adopt and scale AI.",
    details: "5 domains · 25 questions · ~10 min",
    domains: ["Strategy", "Data", "Talent", "Infrastructure", "Governance"],
    icon: Brain,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  devops: {
    id: "devops",
    title: "DevOps Maturity",
    description: "Benchmark your team against the four DORA metrics.",
    details: "4 domains · 16 questions · ~7 min",
    domains: ["Deployment Frequency", "Lead Time", "Change Failure Rate", "Recovery Time"],
    icon: GitBranch,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  enterprise_operating_model: {
    id: "enterprise_operating_model",
    title: "Operating Model",
    description: "Evaluate your enterprise structure across five key pillars.",
    details: "5 domains · 20 questions · ~8 min",
    domains: ["Strategy", "Organization", "Platform", "Operations", "Governance"],
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

interface DomainScore {
  score: number;
  level?: string;
}

interface AssessmentRow {
  id: string;
  framework: string;
  status: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  domain_scores: Record<string, DomainScore> | null;
}

const SERIES_COLORS = [
  "hsl(174, 84%, 32%)",
  "hsl(var(--accent))",
  "hsl(220, 70%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(35, 85%, 55%)",
];

export default function FrameworkDetail() {
  const { framework } = useParams<{ framework: string }>();
  const { user, signOut } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fw = framework ? frameworkDefs[framework] : undefined;

  useEffect(() => {
    if (!framework) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id, framework, status, score, started_at, completed_at, assessment_results(domain_scores)")
        .eq("framework", framework)
        .order("completed_at", { ascending: true });

      const mapped: AssessmentRow[] = (data || []).map((a: any) => ({
        id: a.id,
        framework: a.framework,
        status: a.status,
        score: a.score,
        started_at: a.started_at,
        completed_at: a.completed_at,
        domain_scores: a.assessment_results?.[0]?.domain_scores ?? null,
      }));
      setAssessments(mapped);
      setLoading(false);
    };
    fetchData();
  }, [framework]);

  const completed = useMemo(
    () => assessments.filter((a) => a.status === "completed" && a.score != null),
    [assessments]
  );

  const inProgress = assessments.find((a) => a.status === "in_progress");

  // Build radar data: one series per completed assessment
  const radarData = useMemo(() => {
    if (!completed.length) return [];
    const allDomains = new Set<string>();
    completed.forEach((a) => {
      if (a.domain_scores) Object.keys(a.domain_scores).forEach((d) => allDomains.add(d));
    });
    return Array.from(allDomains).map((domain) => {
      const row: Record<string, any> = {
        domain: domain.length > 14 ? domain.slice(0, 13) + "…" : domain,
        fullMark: 100,
      };
      completed.forEach((a, i) => {
        const label = `#${i + 1} · ${a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}`;
        row[label] = a.domain_scores?.[domain]?.score ?? 0;
      });
      return row;
    });
  }, [completed]);

  const radarSeriesKeys = useMemo(
    () =>
      completed.map((a, i) => `#${i + 1} · ${a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}`),
    [completed]
  );

  // Time series: overall score over time
  const timeSeries = useMemo(
    () =>
      completed.map((a, i) => ({
        label: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : `#${i + 1}`,
        score: a.score ?? 0,
      })),
    [completed]
  );

  if (!fw) return <Navigate to="/dashboard" replace />;

  const Icon = fw.icon;
  const latest = completed[completed.length - 1];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-coral-400"></div>
            <span className="text-2xl font-bold bg-gradient-to-br from-teal-600 to-coral-400 bg-clip-text text-transparent">
              KATALYX
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard</Link>
        </Button>

        {/* Hero */}
        <div className="mb-8 flex items-start gap-4">
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-lg ${fw.bgColor}`}>
            <Icon className={`h-7 w-7 ${fw.color}`} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold">{fw.title}</h1>
            <p className="mt-1 text-muted-foreground">{fw.description}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{fw.details}</p>
          </div>
          <Button asChild>
            <Link to={`/assessment/${fw.id}`}>
              {inProgress ? "Continue" : "Start"} Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : completed.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No completed assessments yet for this framework.</p>
              <Button asChild>
                <Link to={`/assessment/${fw.id}`}>Take your first assessment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Radar (spider) chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Domain Scores Across All Assessments</CardTitle>
                <CardDescription>
                  Each ring is one of your completed assessments — overlay shows progress per domain.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="domain" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    {radarSeriesKeys.map((key, i) => (
                      <Radar
                        key={key}
                        name={key}
                        dataKey={key}
                        stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                        fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                        fillOpacity={i === radarSeriesKeys.length - 1 ? 0.3 : 0.08}
                        strokeWidth={i === radarSeriesKeys.length - 1 ? 2.5 : 1.5}
                        strokeDasharray={i === radarSeriesKeys.length - 1 ? undefined : "4 3"}
                      />
                    ))}
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score over time */}
            <Card>
              <CardHeader>
                <CardTitle>Score Over Time</CardTitle>
                <CardDescription>Overall score trend across assessments.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(174, 84%, 32%)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(174, 84%, 32%)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {latest && (
                  <div className="mt-4 rounded-md bg-primary/5 p-3 text-sm">
                    <p className="font-medium text-primary">Latest: {latest.score}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {latest.completed_at && new Date(latest.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessment list */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>All {fw.title} Assessments</CardTitle>
                <CardDescription>{completed.length} completed · most recent first</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {[...completed].reverse().map((a, idx) => (
                    <div key={a.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {completed.length - idx}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{a.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            {a.completed_at && new Date(a.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/results/${a.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" /> View Results</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
