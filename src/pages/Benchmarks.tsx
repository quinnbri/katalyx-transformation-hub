import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── Industry benchmark data (hardcoded) ─────────────────────────── */

const industryBenchmarks: Record<string, Record<string, { p25: number; median: number; p75: number }>> = {
  ai_readiness: {
    Strategy:       { p25: 30, median: 45, p75: 62 },
    Data:           { p25: 25, median: 40, p75: 58 },
    Talent:         { p25: 20, median: 35, p75: 52 },
    Infrastructure: { p25: 28, median: 42, p75: 60 },
    Governance:     { p25: 22, median: 38, p75: 55 },
  },
  devops: {
    "Deployment Frequency": { p25: 28, median: 44, p75: 65 },
    "Lead Time":            { p25: 25, median: 40, p75: 60 },
    "Change Failure Rate":  { p25: 30, median: 48, p75: 68 },
    "Recovery Time":        { p25: 22, median: 38, p75: 58 },
  },
  enterprise_operating_model: {
    Strategy:     { p25: 32, median: 48, p75: 64 },
    Organization: { p25: 28, median: 42, p75: 58 },
    Platform:     { p25: 24, median: 38, p75: 55 },
    Operations:   { p25: 30, median: 45, p75: 62 },
    Governance:   { p25: 26, median: 40, p75: 56 },
  },
};

const frameworkOptions = [
  { value: "ai_readiness", label: "AI Readiness" },
  { value: "devops", label: "DevOps Maturity" },
  { value: "enterprise_operating_model", label: "Operating Model" },
];

interface DomainScore {
  score: number;
  level: string;
  strengths: string[];
  gaps: string[];
}

/* ── Gauge bar component ─────────────────────────────────────────── */

function BenchmarkGauge({
  domain,
  userScore,
  benchmark,
}: {
  domain: string;
  userScore: number | null;
  benchmark: { p25: number; median: number; p75: number };
}) {
  const delta = userScore != null ? userScore - benchmark.median : null;
  const DeltaIcon = delta != null ? (delta > 2 ? TrendingUp : delta < -2 ? TrendingDown : Minus) : Minus;
  const deltaColor = delta != null ? (delta > 2 ? "text-green-600" : delta < -2 ? "text-accent" : "text-muted-foreground") : "text-muted-foreground";

  return (
    <div className="py-6 border-b border-border/50 last:border-0">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-display text-base font-semibold">{domain}</h3>
          {userScore != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Your score: <span className="font-medium text-foreground">{userScore}%</span>
              {delta != null && (
                <span className={`ml-2 inline-flex items-center gap-0.5 ${deltaColor}`}>
                  <DeltaIcon className="h-3 w-3" />
                  {Math.abs(delta)} pts {delta > 0 ? "above" : delta < 0 ? "below" : "at"} median
                </span>
              )}
            </p>
          )}
        </div>
        {userScore != null && (
          <span className="font-display text-2xl font-bold text-primary">{userScore}%</span>
        )}
      </div>

      {/* Gauge bar */}
      <div className="relative mt-3 h-8 w-full rounded-full overflow-hidden bg-muted/60">
        {/* Gradient bar: red → yellow → green */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: "100%",
            background: "linear-gradient(90deg, hsl(0 84% 60%), hsl(45 93% 47%) 40%, hsl(174 83% 32%) 70%, hsl(200 80% 50%))",
            opacity: 0.25,
          }}
        />

        {/* P25-P75 band (industry interquartile range) */}
        <div
          className="absolute inset-y-1 rounded-full bg-muted-foreground/15 border border-muted-foreground/20"
          style={{
            left: `${benchmark.p25}%`,
            width: `${benchmark.p75 - benchmark.p25}%`,
          }}
        />

        {/* Median tick */}
        <div
          className="absolute inset-y-0 w-0.5 bg-muted-foreground/40"
          style={{ left: `${benchmark.median}%` }}
        />

        {/* User score marker */}
        {userScore != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${Math.min(Math.max(userScore, 3), 97)}%` }}
          >
            {/* Pin */}
            <div className="relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground whitespace-nowrap shadow-md">
                {userScore}
              </div>
              <div className="h-6 w-1.5 rounded-full bg-primary shadow-md" />
            </div>
          </div>
        )}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground px-1">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */

export default function Benchmarks() {
  const { user } = useAuth();
  const [selectedFramework, setSelectedFramework] = useState("ai_readiness");
  const [domainScores, setDomainScores] = useState<Record<string, DomainScore> | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      // Get latest completed assessment for this framework
      const { data: assessment } = await supabase
        .from("assessments")
        .select("id, score")
        .eq("user_id", user.id)
        .eq("framework", selectedFramework)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (assessment) {
        setOverallScore(assessment.score as number);
        const { data: result } = await supabase
          .from("assessment_results")
          .select("domain_scores")
          .eq("assessment_id", assessment.id)
          .single();
        if (result) {
          setDomainScores(result.domain_scores as unknown as Record<string, DomainScore>);
        }
      } else {
        setDomainScores(null);
        setOverallScore(null);
      }
      setLoading(false);
    };
    fetch();
  }, [user, selectedFramework]);

  const benchmarks = industryBenchmarks[selectedFramework] || {};
  const overallBenchmark = useMemo(() => {
    const vals = Object.values(benchmarks);
    if (vals.length === 0) return { p25: 0, median: 0, p75: 0 };
    return {
      p25: Math.round(vals.reduce((s, v) => s + v.p25, 0) / vals.length),
      median: Math.round(vals.reduce((s, v) => s + v.median, 0) / vals.length),
      p75: Math.round(vals.reduce((s, v) => s + v.p75, 0) / vals.length),
    };
  }, [selectedFramework]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard</Link>
          </Button>
          <span className="font-display text-sm font-medium">Industry Benchmarks</span>
        </div>
      </header>

      <main className="container max-w-4xl py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Benchmark Comparison</h1>
            <p className="text-sm text-muted-foreground mt-1">
              See how your scores compare against industry benchmarks.
            </p>
          </div>
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frameworkOptions.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-5 rounded bg-muted-foreground/15 border border-muted-foreground/20" />
                <span>Industry IQR (25th–75th percentile)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-0.5 bg-muted-foreground/40" />
                <span>Industry Median</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-1.5 rounded-full bg-primary" />
                <span>Your Score</span>
              </div>
            </div>

            {/* Overall */}
            <Card className="mb-6">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Overall Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <BenchmarkGauge
                  domain="Overall Score"
                  userScore={overallScore}
                  benchmark={overallBenchmark}
                />
              </CardContent>
            </Card>

            {/* Per-domain */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Domain Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Object.entries(benchmarks).map(([domain, bm]) => (
                  <BenchmarkGauge
                    key={domain}
                    domain={domain}
                    userScore={domainScores?.[domain]?.score ?? null}
                    benchmark={bm}
                  />
                ))}
              </CardContent>
            </Card>

            {!domainScores && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Complete an assessment to see your scores on the benchmarks above.
                </p>
                <Button asChild>
                  <Link to={`/assessment/${selectedFramework}`}>
                    Start Assessment <ArrowLeft className="ml-1.5 h-4 w-4 rotate-180" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
