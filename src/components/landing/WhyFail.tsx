import { Check, X } from "lucide-react";

const failures = [
  "Tech-first thinking with no operating model",
  "Roadmaps built on vibes, not frameworks",
  "No way to measure progress across domains",
  "Expensive consultants, slow to value",
];

const wins = [
  "Assessment across all 5 transformation domains",
  "Prioritized backlog tied to proven frameworks",
  "Clear scoring, benchmarks, and next actions",
  "Start free in the AI advisor — 30 minutes",
];

const WhyFail = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Why Most Transformations Fail
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Most organizations over-index on technology and neglect the people, process, and
            operating model changes success requires. KATALYX closes the gap.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              Without KATALYX
            </div>
            <ul className="mt-6 space-y-3">
              {failures.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-secondary/40 p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              With KATALYX
            </div>
            <ul className="mt-6 space-y-3">
              {wins.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          The same methodology that powered a{" "}
          <span className="font-medium text-foreground">$100M+ AWS transformation practice</span>
          , now available to every team.
        </p>
      </div>
    </section>
  );
};

export default WhyFail;
