import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-24 md:py-36">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gray-900">80% of Digital Transformations Fail.</span>
            <br />
            <span className="bg-gradient-to-r from-teal-600 to-coral-400 bg-clip-text text-transparent">
              Here's Why Yours Won't.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Get an AI-powered transformation roadmap in 30 minutes. Built from the industry
            proven frameworks that have powered hundreds of transformations.
          </p>

          <div className="mt-10 flex justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-base font-semibold" asChild>
              <Link to="/login">
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
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
