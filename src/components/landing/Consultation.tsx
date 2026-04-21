import { Button } from "@/components/ui/button";
import { Mail, Users, Sparkles } from "lucide-react";

const Consultation = () => {
  return (
    <section id="consultation" className="bg-secondary/50 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-primary/30 bg-card p-10 md:p-14">
            <div className="grid gap-10 md:grid-cols-[1.25fr_1fr] md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Free 30-min consultation
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
                  Need a human partner?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Start with the AI advisor for an instant roadmap. If your transformation needs
                  hands-on help, we'll connect you with a trusted KATALYX partner at no cost.
                </p>

                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Vetted transformation partners, matched to your context
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    No obligation — we only connect you if it fits
                  </li>
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button variant="cta" size="pillSm" asChild>
                    <a href="mailto:contact@katalyx.io?subject=Free%20consultation%20request">
                      <Mail className="mr-2 h-4 w-4" aria-hidden />
                      Email us to book
                    </a>
                  </Button>
                  <a
                    href="mailto:contact@katalyx.io"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    contact@katalyx.io
                  </a>
                </div>
              </div>

              <div className="rounded-xl bg-background p-6">
                <p className="text-sm font-medium text-muted-foreground">How it works</p>
                <ol className="mt-4 space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      1
                    </span>
                    <span className="text-foreground">Tell us about your transformation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      2
                    </span>
                    <span className="text-foreground">30-minute call with KATALYX</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      3
                    </span>
                    <span className="text-foreground">Matched with a partner if you need one</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Consultation;
