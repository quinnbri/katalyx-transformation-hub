import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: string;
  framework: string;
  domain: string;
  question_text: string;
  question_type: string;
  question_format: string;
  scenario_context: string | null;
  options: { min: number; max: number; labels: string[]; descriptions?: string[] };
  sort_order: number;
}

interface VariantAssignment {
  question_id: string;
  variant_id: string;
  scenario_context: string;
  question_text: string;
  option_descriptions: string[];
}

const frameworkNames: Record<string, string> = {
  ai_readiness: "AI Readiness Assessment",
  devops: "DevOps Team Assessment",
  enterprise_operating_model: "Enterprise Operating Model",
};

const scaleColors: Record<number, string> = {
  1: "border-red-500/40 bg-red-500/5",
  2: "border-orange-500/40 bg-orange-500/5",
  3: "border-yellow-500/40 bg-yellow-500/5",
  4: "border-emerald-500/40 bg-emerald-500/5",
  5: "border-primary/40 bg-primary/5",
};

export default function Assessment() {
  const { framework } = useParams<{ framework: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentDomainIdx, setCurrentDomainIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [variantMap, setVariantMap] = useState<Record<string, VariantAssignment>>({});

  const domains = useMemo(() => {
    return [...new Set(questions.map((q) => q.domain))];
  }, [questions]);

  const currentQuestions = useMemo(
    () => questions.filter((q) => q.domain === domains[currentDomainIdx]),
    [questions, domains, currentDomainIdx]
  );

  const totalAnswered = Object.keys(responses).length;
  const progress = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  useEffect(() => {
    if (!framework || !user) return;

    const init = async () => {
      // Load template questions
      const { data: qs } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("framework", framework)
        .order("sort_order");
      const templateQuestions = (qs as unknown as Question[]) || [];
      setQuestions(templateQuestions);

      // Get or create assessment
      const { data: existing } = await supabase
        .from("assessments")
        .select("id")
        .eq("user_id", user.id)
        .eq("framework", framework)
        .eq("status", "in_progress")
        .limit(1);

      let aId: string;
      if (existing && existing.length > 0) {
        aId = existing[0].id;
      } else {
        const { data: created } = await supabase
          .from("assessments")
          .insert({ user_id: user.id, framework, status: "in_progress" })
          .select("id")
          .single();
        aId = created!.id;
      }
      setAssessmentId(aId);

      // Load saved responses
      const { data: saved } = await supabase
        .from("assessment_responses")
        .select("question_id, response_value")
        .eq("assessment_id", aId);
      if (saved) {
        const map: Record<string, string> = {};
        saved.forEach((r: any) => { map[r.question_id] = r.response_value; });
        setResponses(map);
      }

      // Load or assign variants
      await loadOrAssignVariants(aId, templateQuestions);
      setLoading(false);
    };
    init();
  }, [framework, user]);

  const loadOrAssignVariants = async (aId: string, templateQuestions: Question[]) => {
    // Check for existing assignments
    const { data: existingAssignments } = await supabase
      .from("assessment_variant_assignments")
      .select("question_id, variant_id")
      .eq("assessment_id", aId);

    const assignedMap: Record<string, string> = {};
    if (existingAssignments) {
      existingAssignments.forEach((a: any) => { assignedMap[a.question_id] = a.variant_id; });
    }

    const unassigned = templateQuestions.filter(q => !assignedMap[q.id]);

    if (unassigned.length > 0) {
      // Fetch all available variants for unassigned questions
      const questionIds = unassigned.map(q => q.id);
      const { data: allVariants } = await supabase
        .from("question_variants")
        .select("*")
        .in("template_question_id", questionIds);

      // Group variants by template
      const variantsByTemplate: Record<string, any[]> = {};
      (allVariants || []).forEach((v: any) => {
        if (!variantsByTemplate[v.template_question_id]) variantsByTemplate[v.template_question_id] = [];
        variantsByTemplate[v.template_question_id].push(v);
      });

      // Randomly assign one variant per question
      const newAssignments: { assessment_id: string; question_id: string; variant_id: string }[] = [];
      for (const q of unassigned) {
        const variants = variantsByTemplate[q.id];
        if (variants && variants.length > 0) {
          const picked = variants[Math.floor(Math.random() * variants.length)];
          assignedMap[q.id] = picked.id;
          newAssignments.push({ assessment_id: aId, question_id: q.id, variant_id: picked.id });
        }
      }

      if (newAssignments.length > 0) {
        await supabase.from("assessment_variant_assignments").insert(newAssignments);
      }
    }

    // Now fetch the actual variant data for all assigned variants
    const variantIds = Object.values(assignedMap);
    if (variantIds.length > 0) {
      const { data: variantData } = await supabase
        .from("question_variants")
        .select("*")
        .in("id", variantIds);

      const vMap: Record<string, VariantAssignment> = {};
      (variantData || []).forEach((v: any) => {
        // Find which question this variant belongs to
        const qId = Object.entries(assignedMap).find(([, vid]) => vid === v.id)?.[0];
        if (qId) {
          vMap[qId] = {
            question_id: qId,
            variant_id: v.id,
            scenario_context: v.scenario_context,
            question_text: v.question_text,
            option_descriptions: v.option_descriptions,
          };
        }
      });
      setVariantMap(vMap);
    }
  };

  const saveResponse = async (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (!assessmentId || !user) return;
    await supabase.from("assessment_responses").upsert(
      { assessment_id: assessmentId, question_id: questionId, user_id: user.id, response_value: value },
      { onConflict: "assessment_id,question_id" }
    );
  };

  const handleSubmit = async () => {
    if (!assessmentId || !user || !framework) return;
    setSubmitting(true);
    try {
      const responsePayload = questions.map((q) => ({
        domain: q.domain,
        question: q.question_text,
        answer: responses[q.id] ? parseInt(responses[q.id]) : null,
        label: q.options?.labels?.[parseInt(responses[q.id] || "1") - 1] || "Not answered",
      }));

      const { data, error } = await supabase.functions.invoke("generate-results", {
        body: { framework, domains, responses: responsePayload },
      });
      if (error) throw error;

      await supabase.from("assessment_results").insert({
        assessment_id: assessmentId,
        user_id: user.id,
        overall_score: data.overall_score,
        domain_scores: data.domain_scores,
        roadmap: data.roadmap,
        ai_summary: data.summary,
      });

      await supabase
        .from("assessments")
        .update({ status: "completed", score: data.overall_score, completed_at: new Date().toISOString() })
        .eq("id", assessmentId);

      navigate(`/results/${assessmentId}`);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error generating results", description: e.message || "Please try again.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  // Get the display data for a question — use variant if available, else fall back to template
  const getQuestionDisplay = (q: Question) => {
    const variant = variantMap[q.id];
    if (variant) {
      return {
        scenario_context: variant.scenario_context,
        question_text: variant.question_text,
        option_descriptions: variant.option_descriptions,
        isScenario: true,
      };
    }
    // Fallback to template data
    const isScenario = q.question_format === "scenario" && q.scenario_context;
    return {
      scenario_context: q.scenario_context,
      question_text: q.question_text,
      option_descriptions: q.options?.descriptions || [],
      isScenario: !!isScenario,
    };
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allCurrentAnswered = currentQuestions.every((q) => responses[q.id]);
  const isLastDomain = currentDomainIdx === domains.length - 1;
  const allAnswered = questions.every((q) => responses[q.id]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {totalAnswered}/{questions.length} questions answered
          </span>
        </div>
      </header>

      <main className="container max-w-3xl py-10">
        <h1 className="font-display text-2xl font-bold">{frameworkNames[framework!] || framework}</h1>

        <div className="mt-4 space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {domains.map((d, i) => (
              <button
                key={d}
                onClick={() => setCurrentDomainIdx(i)}
                className={`transition-colors ${i === currentDomainIdx ? "text-primary font-medium" : "hover:text-foreground"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <h2 className="mt-8 font-display text-xl font-semibold text-primary">{domains[currentDomainIdx]}</h2>

        <div className="mt-6 space-y-6">
          {currentQuestions.map((q, idx) => {
            const display = getQuestionDisplay(q);

            return (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  {display.isScenario ? (
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-foreground/80 italic border-l-2 border-primary/30 pl-3">
                        {display.scenario_context}
                      </p>
                      <CardTitle className="text-base font-medium pt-1">
                        {idx + 1}. {display.question_text}
                      </CardTitle>
                    </div>
                  ) : (
                    <CardTitle className="text-base font-medium">
                      {idx + 1}. {display.question_text}
                    </CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={responses[q.id] || ""}
                    onValueChange={(val) => saveResponse(q.id, val)}
                    className="space-y-2"
                  >
                    {q.options?.labels?.map((label, i) => {
                      const level = i + 1;
                      const isSelected = responses[q.id] === String(level);
                      const variantDesc = display.option_descriptions?.[i];
                      return (
                        <div
                          key={i}
                          className={`flex items-start space-x-3 rounded-lg border p-3 transition-all cursor-pointer ${
                            isSelected
                              ? `${scaleColors[level]} shadow-sm`
                              : "hover:bg-muted/50 border-border"
                          }`}
                          onClick={() => saveResponse(q.id, String(level))}
                        >
                          <RadioGroupItem value={String(level)} id={`${q.id}-${i}`} className="mt-1 shrink-0" />
                          <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer">
                            {display.isScenario ? (
                              <div>
                                <span className="text-sm leading-relaxed">
                                  {variantDesc || label}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-sm font-medium">{label}</span>
                                {q.options?.descriptions?.[i] && (
                                  <span className="block text-xs text-muted-foreground mt-0.5">
                                    {q.options.descriptions[i]}
                                  </span>
                                )}
                              </div>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => { setCurrentDomainIdx((i) => i - 1); window.scrollTo(0, 0); }}
            disabled={currentDomainIdx === 0}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
          </Button>

          {isLastDomain ? (
            <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating Results...
                </>
              ) : (
                "Submit & Get Results"
              )}
            </Button>
          ) : (
            <Button onClick={() => { setCurrentDomainIdx((i) => i + 1); window.scrollTo(0, 0); }} disabled={!allCurrentAnswered}>
              Next: {domains[currentDomainIdx + 1]} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
