const Creator = () => {
  return (
    <section id="about" className="bg-foreground text-background py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Built by Brian Quinn
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4 opacity-80">
            <p>
              With 15+ years leading enterprise transformations across Fortune 500 companies, 
              Brian has seen firsthand why 80% of digital transformations fail — and built 
              KATALYX to fix it.
            </p>
            <p>
              Drawing from 50+ enterprise implementations and over $100M in pipeline generation, 
              KATALYX distills decades of transformation expertise into a data-driven assessment 
              and AI-powered roadmap platform.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            <span className="rounded-full bg-primary/20 px-3 py-1 text-accent">Enterprise Architecture</span>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-accent">Digital Transformation</span>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-accent">DevOps & Platform Engineering</span>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-accent">AI Strategy</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Creator;
