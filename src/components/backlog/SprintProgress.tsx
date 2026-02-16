import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionStatus = "not_started" | "in_progress" | "blocked" | "complete";

interface SprintProgressProps {
  sprintNumber: number;
  actionIds: string[];
  statuses: Record<string, ActionStatus>;
  compact?: boolean;
}

export default function SprintProgress({ sprintNumber, actionIds, statuses, compact }: SprintProgressProps) {
  const total = actionIds.length;
  const completed = actionIds.filter((id) => statuses[id] === "complete").length;
  const inProgress = actionIds.filter((id) => statuses[id] === "in_progress").length;
  const blocked = actionIds.filter((id) => statuses[id] === "blocked").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium">Sprint {sprintNumber}:</span>
        <Progress value={pct} className="h-2 w-20" />
        <span className={cn("font-medium", pct === 100 ? "text-green-600" : "text-muted-foreground")}>
          {pct}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4 pb-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {completed} of {total} actions complete ({pct}%)
        </span>
        <div className="flex items-center gap-3">
          {inProgress > 0 && (
            <span className="flex items-center gap-1 text-primary">
              <Clock className="h-3 w-3" /> {inProgress}
            </span>
          )}
          {blocked > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" /> {blocked}
            </span>
          )}
        </div>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
