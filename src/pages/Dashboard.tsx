import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, GitBranch, Building2, ArrowRight, LogOut } from "lucide-react";

const frameworks = [
  {
    id: "ai_readiness",
    title: "AI Readiness Assessment",
    description: "Evaluate your organization's readiness to adopt and scale AI across strategy, data, talent, infrastructure, and governance.",
    icon: Brain,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "devops",
    title: "DevOps Team Assessment",
    description: "Measure your team's DevOps maturity using DORA metrics — deployment frequency, lead time, change failure rate, and recovery time.",
    icon: GitBranch,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "enterprise_operating_model",
    title: "Enterprise Operating Model",
    description: "Assess your enterprise across 5 domains: Strategy, Organization, Platform, Operations, and Governance.",
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
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  {latestCompleted && (
                    <div className="rounded-md bg-primary/5 p-3 text-sm">
                      <span className="font-medium text-primary">Score: {latestCompleted.score ?? "—"}%</span>
                      <span className="ml-2 text-muted-foreground">
                        · {new Date(latestCompleted.completed_at!).toLocaleDateString()}
                      </span>
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
              <div className="grid grid-cols-4 gap-4 border-b px-6 py-3 text-sm font-medium text-muted-foreground">
                <span>Framework</span>
                <span>Status</span>
                <span>Score</span>
                <span>Date</span>
              </div>
              {assessments.map((a) => (
                <div key={a.id} className="grid grid-cols-4 gap-4 border-b last:border-0 px-6 py-4 text-sm">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
