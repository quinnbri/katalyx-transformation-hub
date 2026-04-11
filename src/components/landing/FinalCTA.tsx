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
            Join transformation leaders who are using proven frameworks to succeed
          </p>

          <div className="mt-10 flex justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 py-6 text-base" asChild>
              <Link to="/agent">
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
