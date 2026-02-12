import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Transform with Confidence?
          </h2>
          <p className="mx-auto mt-4 max-w-lg opacity-90">
            Take your first assessment today. No credit card required, results in 30 minutes.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 px-8 text-base"
            asChild
          >
            <Link to="/login">
              Start Free Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
