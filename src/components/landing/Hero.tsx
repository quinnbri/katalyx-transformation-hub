import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Subtle ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]"
      />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-4 py-1.5 text-sm text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI-powered transformation advisor
          </div>

          <h1 className="mt-6 font-display text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            <span className="text-foreground">80% of Digital Transformations Fail.</span>
            <br />
            <span className="bg-gradient-to-br from-teal-600 to-coral-400 bg-clip-text text-transparent">
              Here's Why Yours Won't.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Chat with an AI advisor for 30 minutes and walk away with a prioritized
            transformation roadmap — built on frameworks proven across hundreds of enterprise
            transformations.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="cta" size="pill" asChild>
              <Link to="/agent">
                Speak to Your AI Advisor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ctaOutline" size="pill" asChild>
              <a href="#consultation">Book a free consultation</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              30 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              Instant results
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
