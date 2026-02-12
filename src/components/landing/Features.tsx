import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Enterprise Maturity Assessment",
    description: "Comprehensive scoring across 5 critical transformation domains with detailed capability breakdown",
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Roadmap",
    description: "Prioritized transformation backlog with 50-100 specific actions, effort estimates, and impact analysis",
  },
  {
    icon: Users,
    title: "Team DevOps Assessments",
    description: "DORA metrics assessment for your teams with benchmarking against industry standards",
  },
  {
    icon: BookOpen,
    title: "Implementation Playbooks",
    description: "100+ battle-tested playbooks from AWS transformations with step-by-step implementation guides",
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-secondary/50 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            What You Get
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to succeed with transformation
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border/50 bg-card p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
