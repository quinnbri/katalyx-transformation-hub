import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Download, Loader2 } from "lucide-react";

interface DomainScore {
  score: number;
  level: string;
  strengths: string[];
  gaps: string[];
}

interface RoadmapItem {
  priority: number;
  action: string;
  domain: string;
  effort: string;
  impact: string;
  timeline: string;
}

interface Result {
  overall_score: number;
  domain_scores: Record<string, DomainScore>;
  roadmap: RoadmapItem[];
  ai_summary: string;
}

const frameworkNames: Record<string, string> = {
  ai_readiness: "AI Readiness Assessment",
  devops: "DevOps Team Assessment",
  enterprise_operating_model: "Enterprise Operating Model",
};

export default function Results() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [framework, setFramework] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: r } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("assessment_id", assessmentId)
        .single();

      if (r) {
        setResult({
          overall_score: r.overall_score as number,
          domain_scores: r.domain_scores as unknown as Record<string, DomainScore>,
          roadmap: r.roadmap as unknown as RoadmapItem[],
          ai_summary: r.ai_summary as string,
        });
      }

      const { data: a } = await supabase
        .from("assessments")
        .select("framework")
        .eq("id", assessmentId)
        .single();
      if (a) setFramework(a.framework);

      setLoading(false);
    };
    fetch();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Results not found.</p>
        <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }

  const scoreColor = (score: number) =>
    score >= 80 ? "text-green-600" : score >= 60 ? "text-primary" : score >= 40 ? "text-yellow-600" : "text-accent";

  const effortBadge = (val: string) => {
    const colors: Record<string, string> = { Low: "bg-green-100 text-green-700", Medium: "bg-yellow-100 text-yellow-700", High: "bg-red-100 text-red-700" };
    return colors[val] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard</Link>
          </Button>
          <span className="font-display text-sm font-medium">{frameworkNames[framework] || framework}</span>
        </div>
      </header>

      <main className="container max-w-4xl py-10">
        {/* Overall Score */}
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center py-10">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Overall Maturity Score</p>
            <p className={`mt-2 font-display text-6xl font-bold ${scoreColor(result.overall_score)}`}>
              {result.overall_score}%
            </p>
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card className="mb-8">
          <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{result.ai_summary}</p>
          </CardContent>
        </Card>

        {/* Domain Scores */}
        <h2 className="mb-4 font-display text-xl font-bold">Domain Breakdown</h2>
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {Object.entries(result.domain_scores).map(([domain, ds]) => (
            <Card key={domain}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{domain}</CardTitle>
                  <span className={`font-display text-2xl font-bold ${scoreColor(ds.score)}`}>{ds.score}%</span>
                </div>
                <span className="text-xs text-muted-foreground">{ds.level}</span>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={ds.score} className="h-2" />
                {ds.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {ds.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {ds.gaps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-accent mb-1">Gaps</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {ds.gaps.map((g, i) => <li key={i}>• {g}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Roadmap */}
        <h2 className="mb-4 font-display text-xl font-bold">Transformation Roadmap</h2>
        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="grid grid-cols-6 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>#</span><span className="col-span-2">Action</span><span>Effort</span><span>Impact</span><span>Timeline</span>
          </div>
          {result.roadmap
            .sort((a, b) => a.priority - b.priority)
            .map((item) => (
              <div key={item.priority} className="grid grid-cols-6 gap-2 border-b last:border-0 px-4 py-3 text-sm">
                <span className="font-bold text-primary">{item.priority}</span>
                <span className="col-span-2">
                  <span className="font-medium">{item.action}</span>
                  <span className="block text-xs text-muted-foreground">{item.domain}</span>
                </span>
                <span><span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${effortBadge(item.effort)}`}>{item.effort}</span></span>
                <span><span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${effortBadge(item.impact)}`}>{item.impact}</span></span>
                <span className="text-xs text-muted-foreground">{item.timeline}</span>
              </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
