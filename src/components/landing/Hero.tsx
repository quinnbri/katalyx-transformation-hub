import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-background" />
      
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Enterprise Transformation Platform
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            <span className="text-foreground">80% of Digital Transformations Fail. </span>
            <span className="text-primary">Here's Why Yours Won't.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Take a data-driven assessment, get an AI-powered transformation roadmap, 
            and start executing with confidence — in under 30 minutes.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base" asChild>
              <Link to="/login">
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 text-base" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              30 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Instant results
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
