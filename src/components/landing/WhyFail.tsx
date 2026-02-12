import { XCircle, CheckCircle } from "lucide-react";

const failures = [
  "No clear baseline or maturity assessment",
  "Strategy disconnected from execution",
  "Siloed teams with no shared operating model",
  "Technology-first without organizational readiness",
];

const solutions = [
  "Data-driven maturity scoring across all domains",
  "AI-generated roadmap connecting strategy to actions",
  "Cross-functional assessment covering 5 key domains",
  "People, process, and technology alignment",
];

const WhyFail = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Why Most Transformations Fail
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            And how KATALYX ensures yours succeeds
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-8 space-y-5">
            <h3 className="font-display text-lg font-semibold text-accent">The Problem</h3>
            {failures.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 space-y-5">
            <h3 className="font-display text-lg font-semibold text-primary">The KATALYX Solution</h3>
            {solutions.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyFail;
