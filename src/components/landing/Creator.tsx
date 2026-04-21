import { Linkedin } from "lucide-react";

const Creator = () => {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Created by
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Brian Quinn
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Former Head of Enterprise Transformation at AWS. Creator of the AWS Cloud Operating
            Model. Current Head of Transformation at London Stock Exchange Group.
          </p>

          <blockquote className="mx-auto mt-8 max-w-2xl border-l-2 border-primary/60 pl-6 text-left text-lg italic text-foreground md:text-center md:border-l-0 md:pl-0">
            "I built KATALYX so any team can access the same frameworks I used to run a
            $100M+ transformation practice — without the consulting price tag."
          </blockquote>

          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="https://www.linkedin.com/in/brian-quinn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Linkedin className="h-4 w-4" aria-hidden />
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Creator;
