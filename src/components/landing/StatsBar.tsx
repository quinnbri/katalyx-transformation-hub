const stats = [
  { value: "50+", label: "Enterprise Implementations" },
  { value: "$100M+", label: "Transformation Pipeline" },
  { value: "15 Years", label: "Framework Development" },
  { value: "5 Domains", label: "Comprehensive Assessment" },
];

const StatsBar = () => {
  return (
    <section className="bg-muted/50 border-y border-border/30">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-primary md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
