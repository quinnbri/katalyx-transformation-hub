import { ClipboardCheck, Brain, Rocket } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Take the Assessment",
    description: "Answer targeted questions across key transformation domains. Takes about 30 minutes.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Get Your Roadmap",
    description: "AI analyzes your responses and generates a prioritized transformation roadmap with specific actions.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Start Transforming",
    description: "Execute with confidence using your personalized playbook, benchmarked against industry standards.",
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
            Three simple steps from assessment to action
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.step} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <step.icon className="h-7 w-7" />
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-accent/10 px-3 py-0.5 font-display text-sm font-semibold text-accent">
                Step {step.step}
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-0.5 w-[calc(50%-2rem)] bg-gradient-to-r from-primary/30 to-transparent md:block translate-x-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
