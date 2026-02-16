import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend,
} from "recharts";

interface DomainScore {
  score: number;
  level: string;
  strengths: string[];
  gaps: string[];
}

interface AssessmentWithResult {
  id: string;
  framework: string;
  status: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  domain_scores?: Record<string, DomainScore> | null;
}

interface FrameworkDef {
  id: string;
  title: string;
  description: string;
  details: string;
  domains: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface Props {
  fw: FrameworkDef;
  assessments: AssessmentWithResult[];
  inProgress: AssessmentWithResult | undefined;
}

export default function FrameworkCard({ fw, assessments, inProgress }: Props) {
  const completed = assessments.filter((a) => a.status === "completed" && a.score != null);
  const latest = completed[0];
  const previous = completed[1];

  // Build radar data overlaying latest vs previous
  const radarData = latest?.domain_scores
    ? Object.entries(latest.domain_scores).map(([domain, ds]) => {
        const prev = previous?.domain_scores?.[domain];
        return {
          domain: domain.length > 12 ? domain.slice(0, 11) + "…" : domain,
          Latest: ds.score,
          Previous: prev?.score ?? 0,
          fullMark: 100,
        };
      })
    : null;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
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

      <CardContent className="mt-auto space-y-4">
        {/* Radar chart overlay */}
        {radarData && radarData.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-2">
            <p className="text-xs font-medium text-muted-foreground mb-1 px-1">
              {previous ? "Latest vs Previous" : "Latest Scores"}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Latest"
                  dataKey="Latest"
                  stroke="hsl(174, 84%, 32%)"
                  fill="hsl(174, 84%, 32%)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                {previous && (
                  <Radar
                    name="Previous"
                    dataKey="Previous"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                )}
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Latest score banner */}
        {latest && (() => {
          const diff = previous ? latest.score! - previous.score! : null;
          return (
            <div className="rounded-md bg-primary/5 p-3 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">Score: {latest.score}%</span>
                {diff !== null && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    diff > 0 ? "text-green-600" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {diff > 0 ? "+" : ""}{diff}%
                  </span>
                )}
                <span className="text-muted-foreground">
                  · {new Date(latest.completed_at!).toLocaleDateString()}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to={`/results/${latest.id}`}><Eye className="mr-1 h-3 w-3" /> View</Link>
              </Button>
            </div>
          );
        })()}

        {/* Past 3 assessments */}
        {completed.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Past Assessments</p>
            {completed.slice(1, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-1.5 text-xs">
                <div>
                  <span className="font-medium">{a.score}%</span>
                  <span className="ml-2 text-muted-foreground">{new Date(a.completed_at!).toLocaleDateString()}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" asChild>
                  <Link to={`/results/${a.id}`}><Eye className="mr-1 h-3 w-3" /> View</Link>
                </Button>
              </div>
            ))}
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
}
