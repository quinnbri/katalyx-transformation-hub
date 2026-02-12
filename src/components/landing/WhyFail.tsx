const WhyFail = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/50 bg-card p-10 md:p-16 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Why Most Transformations Fail
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Most organizations over-index on technology and neglect the people, process, and
            operating model changes required for success.
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            <span className="font-semibold text-foreground">KATALYX solves this</span> by giving you a comprehensive framework that addresses all five critical
            domains: Strategy, Organization, Platform, Operations, and Governance.
          </p>

          <div className="mt-8 inline-block rounded-full bg-secondary px-6 py-3">
            <span className="text-sm font-medium text-primary">
              The same methodology that powered AWS's $100M+ transformation practice
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyFail;
