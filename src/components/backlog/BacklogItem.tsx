import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Clock,
  Flame,
  User,
  Link2,
  Target,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BacklogItemStatus = "todo" | "in_progress" | "complete";

export interface BacklogItemROI {
  timeSavings?: string;
  riskReduction?: string;
  cost?: string;
  payback?: string;
}

export interface BacklogItemProps {
  title: string;
  effort: number;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  owner: string;
  successMetric: string;
  dependencies?: string[];
  aiContext: string;
  estimatedROI?: BacklogItemROI;
  status?: BacklogItemStatus;
  onStatusChange?: (status: BacklogItemStatus) => void;
}

const impactStyles: Record<string, string> = {
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  LOW: "bg-muted text-muted-foreground border-border",
};

const statusCycle: BacklogItemStatus[] = ["todo", "in_progress", "complete"];

export default function BacklogItem({
  title,
  effort,
  impact,
  owner,
  successMetric,
  dependencies = [],
  aiContext,
  estimatedROI,
  status = "todo",
  onStatusChange,
}: BacklogItemProps) {
  const [open, setOpen] = useState(false);

  const cycleStatus = () => {
    const idx = statusCycle.indexOf(status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    onStatusChange?.(next);
  };

  const checked = status === "complete";
  const indeterminate = status === "in_progress";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card
        className={cn(
          "transition-all",
          status === "complete" && "opacity-60"
        )}
      >
        {/* Collapsed row */}
        <CardHeader className="p-0">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Checkbox */}
            <Checkbox
              checked={indeterminate ? "indeterminate" : checked}
              onCheckedChange={cycleStatus}
              aria-label={`Mark "${title}" status`}
              className="shrink-0"
            />

            {/* Expand trigger */}
            <CollapsibleTrigger className="flex flex-1 items-center gap-3 text-left min-w-0">
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open ? "rotate-0" : "-rotate-90"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  status === "complete" && "line-through"
                )}
              >
                {title}
              </span>
            </CollapsibleTrigger>

            {/* Meta chips */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {effort}h
              </span>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-semibold", impactStyles[impact])}
              >
                {impact}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Expanded details */}
        <CollapsibleContent>
          <CardContent className="border-t px-4 pt-4 pb-4 space-y-4">
            {/* Key details grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail icon={Clock} label="Effort" value={`${effort} hours`} />
              <Detail icon={Flame} label="Impact" value={impact} />
              <Detail icon={User} label="Owner" value={owner} />
              <Detail icon={Target} label="Success Metric" value={successMetric} />
            </div>

            {/* Dependencies */}
            {dependencies.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Dependencies</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {dependencies.map((dep) => (
                      <Badge key={dep} variant="secondary" className="text-[10px]">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Context */}
            {aiContext && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Why this matters
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{aiContext}</p>
              </div>
            )}

            {/* ROI Breakdown */}
            {estimatedROI && Object.values(estimatedROI).some(Boolean) && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  ROI Breakdown
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  {estimatedROI.timeSavings && (
                    <ROIRow label="Time Savings" value={estimatedROI.timeSavings} />
                  )}
                  {estimatedROI.riskReduction && (
                    <ROIRow label="Risk Reduction" value={estimatedROI.riskReduction} />
                  )}
                  {estimatedROI.cost && (
                    <ROIRow label="Cost" value={estimatedROI.cost} />
                  )}
                  {estimatedROI.payback && (
                    <ROIRow label="Payback" value={estimatedROI.payback} />
                  )}
                </div>
              </div>
            )}

            {/* Status label */}
            {status !== "todo" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  status === "in_progress"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-secondary text-secondary-foreground border-border"
                )}
              >
                {status === "in_progress" ? "In Progress" : "Complete"}
              </Badge>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function ROIRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
