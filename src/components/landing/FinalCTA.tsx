import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(174,83%,22%)] px-8 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/20">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/15" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-accent/10" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Transform with Confidence?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
              Take your first assessment today. No credit card required, results in 30 minutes.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base shadow-lg shadow-accent/25"
              asChild
            >
              <Link to="/login">
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
