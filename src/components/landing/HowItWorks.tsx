const steps = [
  {
    number: "1",
    title: "Take Assessment",
    description: "30-minute enterprise assessment across Strategy, Organization, Platform, Operations, and Governance",
  },
  {
    number: "2",
    title: "Get Your Roadmap",
    description: "AI analyzes your answers and generates a prioritized transformation backlog with effort estimates",
  },
  {
    number: "3",
    title: "Start Transforming",
    description: "Access 100+ playbooks, industry benchmarks, and implementation guides",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to your transformation roadmap
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
                <span className="font-display text-3xl font-bold text-primary">{step.number}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
