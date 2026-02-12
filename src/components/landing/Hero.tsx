import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(174,83%,22%)] py-20 md:py-32">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/50" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(0,100%,71%,0.08),_transparent_60%)]" />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Enterprise Transformation Platform
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-primary-foreground md:text-6xl">
            80% of Digital Transformations Fail.{" "}
            <span className="text-accent">Here's Why Yours Won't.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
            Take a data-driven assessment, get an AI-powered transformation roadmap, 
            and start executing with confidence — in under 30 minutes.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base shadow-lg shadow-accent/25" asChild>
              <Link to="/login">
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-accent" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-accent" />
              30 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-accent" />
              Instant results
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
