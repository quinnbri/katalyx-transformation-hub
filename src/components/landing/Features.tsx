import { BarChart3, Brain, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: BarChart3,
    title: "Enterprise Maturity Assessment",
    description: "Comprehensive evaluation across Strategy, Organization, Platform, Operations, and Governance domains.",
  },
  {
    icon: Brain,
    title: "AI-Powered Roadmap",
    description: "Get a prioritized transformation plan with specific actions, effort estimates, and expected impact.",
  },
  {
    icon: Users,
    title: "Team DevOps Assessments",
    description: "Benchmark your teams against DORA metrics — deployment frequency, lead time, change failure rate, and recovery.",
  },
  {
    icon: BookOpen,
    title: "Implementation Playbooks",
    description: "Step-by-step guides and best practices drawn from 15+ years of enterprise transformation experience.",
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-secondary/30 py-20 md:py-28">
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
            <Card key={feature.title} className="border-border/50 bg-card transition-shadow hover:shadow-md">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
