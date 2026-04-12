import { cn } from "@/lib/utils";

export type DomainStatus = "pending" | "active" | "complete";
export type DomainProgress = { name: string; status: DomainStatus };

interface AssessmentProgressProps {
  domains: DomainProgress[];
  framework: string | null;
}

const frameworkLabels: Record<string, string> = {
  devops: "DevOps Maturity",
  ai_readiness: "AI Readiness",
  enterprise_operating_model: "Operating Model",
};

export default function AssessmentProgress({ domains, framework }: AssessmentProgressProps) {
  if (!framework || domains.length === 0) return null;

  const completed = domains.filter((d) => d.status === "complete").length;
  const total = domains.length;

  return (
    <div className="w-full animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-4">
        {/* Framework label + count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">
            {frameworkLabels[framework] || framework}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground/40">
            {completed} / {total} complete
          </span>
        </div>

        {/* Domain boxes */}
        <div className="flex gap-2">
          {domains.map((domain) => (
            <div
              key={domain.name}
              className={cn(
                "flex-1 rounded-xl px-3 py-2.5 text-center transition-all duration-500 border",
                domain.status === "complete" &&
                  "bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_-4px_hsl(152,69%,53%)]",
                domain.status === "active" &&
                  "bg-amber-500/15 border-amber-500/30 shadow-[0_0_12px_-4px_hsl(38,92%,50%)] animate-pulse",
                domain.status === "pending" &&
                  "bg-muted/30 border-border/20"
              )}
            >
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-semibold tracking-wide leading-tight",
                  domain.status === "complete" && "text-emerald-400",
                  domain.status === "active" && "text-amber-400",
                  domain.status === "pending" && "text-muted-foreground/40"
                )}
              >
                {domain.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
