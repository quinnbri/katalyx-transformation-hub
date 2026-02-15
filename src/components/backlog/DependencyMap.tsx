import { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, User, Target, Sparkles, TrendingUp, Link2 } from "lucide-react";

interface Action {
  id: string;
  title: string;
  effort: number;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  owner: string;
  successMetric: string;
  dependencies: string[];
  aiContext: string;
  estimatedROI: {
    timeSavings: string;
    riskReduction: string;
    cost: string;
    payback: string;
  };
}

interface Sprint {
  number: number;
  timeline: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  budget: number;
  actions: Action[];
}

interface DependencyMapProps {
  sprints: Sprint[];
}

const sprintColor = (n: number): string => {
  if (n <= 3) return "hsl(217 91% 60%)";   // blue
  if (n <= 6) return "hsl(142 71% 45%)";   // green
  return "hsl(45 93% 47%)";                 // yellow
};

const sprintBg = (n: number): string => {
  if (n <= 3) return "hsl(217 91% 95%)";
  if (n <= 6) return "hsl(142 71% 93%)";
  return "hsl(45 93% 92%)";
};

const impactStyles: Record<string, string> = {
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  LOW: "bg-muted text-muted-foreground border-border",
};

export default function DependencyMap({ sprints }: DependencyMapProps) {
  const [selectedAction, setSelectedAction] = useState<(Action & { sprintNum: number }) | null>(null);

  // Build action → sprint lookup
  const actionSprintMap = useMemo(() => {
    const map = new Map<string, number>();
    sprints.forEach((s) => s.actions.forEach((a) => map.set(a.id, s.number)));
    return map;
  }, [sprints]);

  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = [];
    const es: Edge[] = [];

    // Layout: sprints as columns, actions stacked vertically
    const COL_WIDTH = 280;
    const ROW_HEIGHT = 80;

    sprints.forEach((sprint, si) => {
      const x = si * COL_WIDTH;

      // Sprint group label node
      ns.push({
        id: `sprint-label-${sprint.number}`,
        type: "default",
        position: { x: x + 20, y: 0 },
        data: { label: `Sprint ${sprint.number} — ${sprint.timeline}` },
        style: {
          background: sprintBg(sprint.number),
          border: `2px solid ${sprintColor(sprint.number)}`,
          borderRadius: "8px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 700,
          color: sprintColor(sprint.number),
          width: COL_WIDTH - 40,
          textAlign: "center" as const,
        },
        selectable: false,
        draggable: false,
      });

      sprint.actions.forEach((action, ai) => {
        const y = (ai + 1) * ROW_HEIGHT + 20;

        ns.push({
          id: action.id,
          type: "default",
          position: { x: x + 10, y },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: { label: action.title },
          style: {
            background: "hsl(var(--background))",
            border: `2px solid ${sprintColor(sprint.number)}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "11px",
            fontWeight: 500,
            width: COL_WIDTH - 20,
            cursor: "pointer",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
          },
        });

        // Edges from dependencies → this action
        action.dependencies.forEach((depId) => {
          es.push({
            id: `${depId}->${action.id}`,
            source: depId,
            target: action.id,
            animated: true,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
          });
        });
      });
    });

    return { nodes: ns, edges: es };
  }, [sprints]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.id.startsWith("sprint-label-")) return;
      for (const sprint of sprints) {
        const action = sprint.actions.find((a) => a.id === node.id);
        if (action) {
          setSelectedAction({ ...action, sprintNum: sprint.number });
          return;
        }
      }
    },
    [sprints]
  );

  return (
    <div className="h-[500px] rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.id.startsWith("sprint-label-")) return "transparent";
            const sn = actionSprintMap.get(n.id) ?? 1;
            return sprintColor(sn);
          }}
          maskColor="hsl(var(--muted) / 0.7)"
          style={{ borderRadius: 8 }}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-3 text-xs text-muted-foreground border-t">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: sprintColor(1) }} /> Sprint 1–3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: sprintColor(4) }} /> Sprint 4–6
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: sprintColor(7) }} /> Sprint 7+
        </span>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedAction} onOpenChange={(o) => !o && setSelectedAction(null)}>
        <DialogContent className="max-w-lg">
          {selectedAction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedAction.title}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Sprint {selectedAction.sprintNum}
                </p>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailRow icon={Clock} label="Effort" value={`${selectedAction.effort} hours`} />
                  <DetailRow icon={Flame} label="Impact" value={selectedAction.impact} />
                  <DetailRow icon={User} label="Owner" value={selectedAction.owner} />
                  <DetailRow icon={Target} label="Success Metric" value={selectedAction.successMetric} />
                </div>

                {selectedAction.dependencies.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Dependencies</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {selectedAction.dependencies.map((dep) => (
                          <Badge key={dep} variant="secondary" className="text-[10px]">{dep}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                    <Sparkles className="h-3.5 w-3.5" /> Why this matters
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selectedAction.aiContext}</p>
                </div>

                {selectedAction.estimatedROI && (
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <TrendingUp className="h-3.5 w-3.5" /> ROI Breakdown
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2 text-sm">
                      {selectedAction.estimatedROI.timeSavings && (
                        <ROIRow label="Time Savings" value={selectedAction.estimatedROI.timeSavings} />
                      )}
                      {selectedAction.estimatedROI.riskReduction && (
                        <ROIRow label="Risk Reduction" value={selectedAction.estimatedROI.riskReduction} />
                      )}
                      {selectedAction.estimatedROI.cost && (
                        <ROIRow label="Cost" value={selectedAction.estimatedROI.cost} />
                      )}
                      {selectedAction.estimatedROI.payback && (
                        <ROIRow label="Payback" value={selectedAction.estimatedROI.payback} />
                      )}
                    </div>
                  </div>
                )}

                <Badge variant="outline" className={`text-[10px] font-semibold ${impactStyles[selectedAction.impact]}`}>
                  {selectedAction.impact}
                </Badge>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
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
