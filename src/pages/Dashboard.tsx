import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, GitBranch, Building2, ArrowRight, LogOut, Eye, BarChart3 } from "lucide-react";

const frameworks = [
  {
    id: "ai_readiness",
    title: "AI Readiness",
    description: "Assess how prepared your org is to adopt and scale AI.",
    details: "5 domains · 25 questions · ~10 min",
    domains: ["Strategy", "Data", "Talent", "Infrastructure", "Governance"],
    icon: Brain,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "devops",
    title: "DevOps Maturity",
    description: "Benchmark your team against the four DORA metrics.",
    details: "4 domains · 16 questions · ~7 min",
    domains: ["Deployment Frequency", "Lead Time", "Change Failure Rate", "Recovery Time"],
    icon: GitBranch,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "enterprise_operating_model",
    title: "Operating Model",
    description: "Evaluate your enterprise structure across five key pillars.",
    details: "5 domains · 20 questions · ~8 min",
    domains: ["Strategy", "Organization", "Platform", "Operations", "Governance"],
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

interface Assessment {
  id: string;
  framework: string;
  status: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      const { data } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false });
      setAssessments((data as Assessment[]) || []);
      setLoading(false);
    };
    fetchAssessments();
  }, []);

  const getFrameworkAssessments = (frameworkId: string) =>
    assessments.filter((a) => a.framework === frameworkId);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">KATALY</span>
              <span className="text-accent">X</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/benchmarks"><BarChart3 className="mr-1.5 h-4 w-4" /> Benchmarks</Link>
            </Button>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Your Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Choose an assessment framework to begin your transformation journey.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {frameworks.map((fw) => {
            const fwAssessments = getFrameworkAssessments(fw.id);
            const latestCompleted = fwAssessments.find((a) => a.status === "completed");
            const inProgress = fwAssessments.find((a) => a.status === "in_progress");

            return (
              <Card key={fw.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg ${fw.bgColor}`}>
                    <fw.icon className={`h-6 w-6 ${fw.color}`} />
                  </div>
                  <CardTitle className="text-lg">{fw.title}</CardTitle>
                  <CardDescription className="text-sm">{fw.description}</CardDescription>
                  <p className="text-xs text-muted-foreground/70 mt-1">{fw.details}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fw.domains.map((d) => (
                      <span key={d} className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  {latestCompleted && (
                    <div className="rounded-md bg-primary/5 p-3 text-sm flex items-center justify-between">
                      <div>
                        <span className="font-medium text-primary">Score: {latestCompleted.score ?? "—"}%</span>
                        <span className="ml-2 text-muted-foreground">
                          · {new Date(latestCompleted.completed_at!).toLocaleDateString()}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link to={`/results/${latestCompleted.id}`}>
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Link>
                      </Button>
                    </div>
                  )}
                  {inProgress && (
                    <div className="rounded-md bg-accent/10 p-3 text-sm text-accent font-medium">
                      Assessment in progress
                    </div>
                  )}
                  <Button className="w-full" asChild>
                    <Link to={`/assessment/${fw.id}`}>
                      {inProgress ? "Continue" : "Start"} Assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Past Assessments */}
        {assessments.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold">Past Assessments</h2>
            <div className="rounded-lg border bg-background">
              <div className="grid grid-cols-5 gap-4 border-b px-6 py-3 text-sm font-medium text-muted-foreground">
                <span>Framework</span>
                <span>Status</span>
                <span>Score</span>
                <span>Date</span>
                <span></span>
              </div>
              {assessments.map((a) => (
                <div key={a.id} className="grid grid-cols-5 gap-4 border-b last:border-0 px-6 py-4 text-sm items-center">
                  <span className="font-medium capitalize">{a.framework.replace(/_/g, " ")}</span>
                  <span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === "completed" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    }`}>
                      {a.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                  </span>
                  <span>{a.score != null ? `${a.score}%` : "—"}</span>
                  <span className="text-muted-foreground">{new Date(a.started_at).toLocaleDateString()}</span>
                  <span>
                    {a.status === "completed" ? (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link to={`/results/${a.id}`}><Eye className="mr-1 h-3 w-3" /> Results</Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link to={`/assessment/${a.framework}`}>Continue</Link>
                      </Button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
