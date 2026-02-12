const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <span className="font-display text-xs font-bold text-primary-foreground">K</span>
          </div>
          <span className="font-display text-sm font-semibold">KATALYX</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} KATALYX. All rights reserved.
        </p>
        <a
          href="mailto:brian@katalyx.io"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          brian@katalyx.io
        </a>
      </div>
    </footer>
  );
};

export default Footer;
