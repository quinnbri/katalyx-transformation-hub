import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Transform with Confidence?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with the AI advisor. If you need a human partner, we'll connect you with one.
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

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • Get results in 30 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
