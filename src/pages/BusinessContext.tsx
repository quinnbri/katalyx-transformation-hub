import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DRIVERS = [
  "Datacenter exit with deadline",
  "Regulatory compliance deadline",
  "Cost reduction target",
  "Competitive pressure / time-to-market",
  "M&A integration",
  "Other",
];

const CONSTRAINTS = [
  "Headcount freeze",
  "Technology freeze (specific vendors locked in)",
  "Must preserve specific team skills/roles",
  "Legacy systems that cannot change",
  "Regulatory certifications to maintain",
  "Customer contractual commitments",
];

export default function BusinessContext() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [driver, setDriver] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [budget, setBudget] = useState("");
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleConstraint = (c: string) => {
    setSelectedConstraints((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = async () => {
    if (!user || !assessmentId || !driver) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("business_context").insert({
        user_id: user.id,
        assessment_id: assessmentId,
        transformation_driver: driver,
        target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
        budget_usd: budget ? parseFloat(budget) : null,
        hard_constraints: selectedConstraints,
        additional_context: additionalContext || null,
      });

      if (error) throw error;
      navigate(`/backlog/${assessmentId}`);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error saving business context",
        description: "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Business Context</span>
        </div>
      </header>

      <main className="container max-w-2xl py-10">
        <h1 className="font-display text-2xl font-bold">Business Context</h1>
        <p className="mt-2 text-muted-foreground">
          Help us tailor your transformation roadmap by providing business constraints and priorities.
        </p>

        <div className="mt-8 space-y-6">
          {/* 1. Transformation Driver */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                What's your primary transformation driver?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={driver} onValueChange={setDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver..." />
                </SelectTrigger>
                <SelectContent>
                  {DRIVERS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 2. Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                What's your timeline?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Target completion date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* 3. Budget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                What's your budget constraint?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Total transformation budget (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 500000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="pl-7"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Hard Constraints */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                What hard constraints do you have?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONSTRAINTS.map((c) => (
                <div key={c} className="flex items-center space-x-3">
                  <Checkbox
                    id={c}
                    checked={selectedConstraints.includes(c)}
                    onCheckedChange={() => toggleConstraint(c)}
                  />
                  <Label htmlFor={c} className="text-sm cursor-pointer">
                    {c}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 5. Additional Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Additional context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any other constraints or priorities we should know about..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                maxLength={2000}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!driver || submitting} size="lg">
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Continue to Backlog →"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
