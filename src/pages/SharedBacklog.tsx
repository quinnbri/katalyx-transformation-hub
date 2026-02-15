import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  GitBranch,
  Building2,
  CalendarDays,
  DollarSign,
  Loader2,
  Clock,
  Flame,
  User,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  title: string;
  effort: number;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  owner: string;
  successMetric: string;
  dependencies: string[];
  aiContext: string;
  estimatedROI: { timeSavings: string; riskReduction: string; cost: string; payback: string };
}

interface Sprint {
  number: number;
  timeline: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  budget: number;
  actions: Action[];
}

interface SharedData {
  company_name: string | null;
  backlog_data: { sprints: Sprint[] };
  scores: Record<string, number> | null;
  business_context: { driver?: string; timeline?: string; budget?: string } | null;
  created_at: string;
}

const priorityStyles: Record<string, string> = {
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  LOW: "bg-muted text-muted-foreground border-border",
};

export default function SharedBacklog() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data: rows, error: err } = await supabase
        .from("shared_backlogs" as any)
        .select("company_name, backlog_data, scores, business_context, created_at")
        .eq("share_token", token)
        .limit(1);

      if (err || !rows || (rows as any[]).length === 0) {
        setError("This shared backlog was not found or has expired.");
      } else {
        setData((rows as any[])[0] as SharedData);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-coral-400"></div>
            <span className="text-2xl font-bold bg-gradient-to-br from-teal-600 to-coral-400 bg-clip-text text-transparent">
              KATALYX
            </span>
            <Badge variant="outline" className="text-[10px]">Shared View</Badge>
          </div>
          <span className="text-xs text-muted-foreground">Read-only</span>
        </div>
      </header>

      <main className="container max-w-5xl py-8">
        <div className="rounded-xl border bg-background p-6 mb-8">
          <h1 className="font-display text-2xl font-bold">
            {data.company_name || "Organization"} — Transformation Roadmap
          </h1>
          {data.business_context?.driver && (
            <p className="mt-1 text-sm text-muted-foreground">
              Driver: {data.business_context.driver}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {data.backlog_data.sprints.map((sprint) => (
            <div key={sprint.number}>
              <h3 className="mb-3 font-display text-lg font-semibold">
                Sprint {sprint.number}{" "}
                <span className="text-muted-foreground font-normal">({sprint.timeline})</span>
                <Badge
                  variant="outline"
                  className={cn("ml-2 text-[10px] font-semibold", priorityStyles[sprint.priority])}
                >
                  {sprint.priority}
                </Badge>
              </h3>
              <div className="space-y-2">
                {sprint.actions.map((action) => (
                  <Card key={action.id}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> {action.effort}h
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] font-semibold", priorityStyles[action.impact])}>
                            {action.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Owner:</span>
                          <span className="font-medium">{action.owner}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Metric:</span>
                          <span className="font-medium">{action.successMetric}</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                          <Sparkles className="h-3.5 w-3.5" /> Why this matters
                        </div>
                        <p className="text-sm text-foreground/80">{action.aiContext}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground">
          Generated by Katalyx · Shared roadmap
        </div>
      </main>
    </div>
  );
}
