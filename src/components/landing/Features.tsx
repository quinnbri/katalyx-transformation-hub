import { BarChart3, Brain, Users, BookOpen } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Enterprise Maturity Assessment",
    description: "Comprehensive evaluation across Strategy, Organization, Platform, Operations, and Governance domains.",
    gradient: "from-primary to-[hsl(174,83%,25%)]",
  },
  {
    icon: Brain,
    title: "AI-Powered Roadmap",
    description: "Get a prioritized transformation plan with specific actions, effort estimates, and expected impact.",
    gradient: "from-accent to-[hsl(0,80%,60%)]",
  },
  {
    icon: Users,
    title: "Team DevOps Assessments",
    description: "Benchmark your teams against DORA metrics — deployment frequency, lead time, change failure rate, and recovery.",
    gradient: "from-primary to-[hsl(174,83%,25%)]",
  },
  {
    icon: BookOpen,
    title: "Implementation Playbooks",
    description: "Step-by-step guides and best practices drawn from 15+ years of enterprise transformation experience.",
    gradient: "from-accent to-[hsl(0,80%,60%)]",
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-gradient-to-b from-secondary/50 to-secondary py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            What You Get
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to transform with confidence
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-5`} />
              <div className="relative flex gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-md`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
