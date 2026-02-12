const Creator = () => {
  return (
    <section id="about" className="bg-secondary/50 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-muted-foreground">Created by</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Brian Quinn
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            Former Head of Enterprise Transformation at AWS • Creator of the AWS Cloud Operating
            Model • Current Head of Transformation at London Stock Exchange
          </p>
        </div>
      </div>
    </section>
  );
};

export default Creator;
