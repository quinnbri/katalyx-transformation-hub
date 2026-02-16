import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompletionResult {
  achieved: "yes" | "partially" | "no";
  retrospectiveNotes?: string;
}

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  successMetric: string;
  onConfirm: (result: CompletionResult) => void;
}

const options = [
  { value: "yes" as const, label: "Yes", icon: CheckCircle2, color: "text-green-600 border-green-500 bg-green-500/10" },
  { value: "partially" as const, label: "Partially", icon: AlertTriangle, color: "text-yellow-600 border-yellow-500 bg-yellow-500/10" },
  { value: "no" as const, label: "No", icon: XCircle, color: "text-destructive border-destructive bg-destructive/10" },
];

export default function CompletionDialog({ open, onOpenChange, successMetric, onConfirm }: CompletionDialogProps) {
  const [achieved, setAchieved] = useState<"yes" | "partially" | "no" | null>(null);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!achieved) return;
    onConfirm({ achieved, retrospectiveNotes: achieved === "no" ? notes || undefined : undefined });
    setAchieved(null);
    setNotes("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setAchieved(null);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Did you achieve the success metric?</DialogTitle>
          <DialogDescription className="pt-2 font-medium text-foreground/80">
            "{successMetric}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 py-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = achieved === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAchieved(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all text-sm font-medium",
                  selected ? opt.color : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Icon className={cn("h-5 w-5", selected ? "" : "text-muted-foreground")} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {achieved === "no" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">What happened? (retrospective note)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What blocked success? What would you do differently?"
              className="h-20 text-sm"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!achieved}>Mark Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
