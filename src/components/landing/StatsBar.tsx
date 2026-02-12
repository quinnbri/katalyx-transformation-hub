const stats = [
  { value: "50+", label: "Enterprise Implementations" },
  { value: "$100M+", label: "Pipeline Generated" },
  { value: "15+", label: "Years Experience" },
  { value: "5", label: "Assessment Domains" },
];

const StatsBar = () => {
  return (
    <section className="bg-foreground text-background">
      <div className="container py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-accent md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm opacity-70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
