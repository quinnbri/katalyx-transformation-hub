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
  options: { min: number; max: number; labels: string[] };
  sort_order: number;
}

const frameworkNames: Record<string, string> = {
  ai_readiness: "AI Readiness Assessment",
  devops: "DevOps Team Assessment",
  enterprise_operating_model: "Enterprise Operating Model",
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

  const domains = useMemo(() => {
    const unique = [...new Set(questions.map((q) => q.domain))];
    return unique;
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
      // Fetch questions
      const { data: qs } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("framework", framework)
        .order("sort_order");
      setQuestions((qs as unknown as Question[]) || []);

      // Find or create assessment
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

      setLoading(false);
    };
    init();
  }, [framework, user]);

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
      // Build responses payload for AI
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

      // Save results
      await supabase.from("assessment_results").insert({
        assessment_id: assessmentId,
        user_id: user.id,
        overall_score: data.overall_score,
        domain_scores: data.domain_scores,
        roadmap: data.roadmap,
        ai_summary: data.summary,
      });

      // Mark assessment complete
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
      {/* Header */}
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

        {/* Progress */}
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

        {/* Domain title */}
        <h2 className="mt-8 font-display text-xl font-semibold text-primary">{domains[currentDomainIdx]}</h2>

        {/* Questions */}
        <div className="mt-6 space-y-6">
          {currentQuestions.map((q, idx) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  {idx + 1}. {q.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={responses[q.id] || ""}
                  onValueChange={(val) => saveResponse(q.id, val)}
                  className="space-y-2"
                >
                  {q.options?.labels?.map((label, i) => (
                    <div key={i} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={String(i + 1)} id={`${q.id}-${i}`} />
                      <Label htmlFor={`${q.id}-${i}`} className="flex-1 cursor-pointer text-sm">
                        <span className="font-medium">{i + 1}.</span> {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentDomainIdx((i) => i - 1)}
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
            <Button onClick={() => setCurrentDomainIdx((i) => i + 1)} disabled={!allCurrentAnswered}>
              Next: {domains[currentDomainIdx + 1]} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
