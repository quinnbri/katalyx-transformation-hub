import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/70 bg-background py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2" aria-label="KATALYX home">
              <div
                className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-600 to-coral-400"
                aria-hidden
              />
              <span className="font-display text-xl font-bold bg-gradient-to-br from-teal-600 to-coral-400 bg-clip-text text-transparent">
                KATALYX
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI-powered transformation advisor built on frameworks proven across hundreds of
              enterprise transformations.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/agent" className="text-foreground/80 hover:text-foreground">
                  AI Advisor
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="text-foreground/80 hover:text-foreground">
                  How it works
                </a>
              </li>
              <li>
                <a href="#features" className="text-foreground/80 hover:text-foreground">
                  What you get
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#about" className="text-foreground/80 hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#consultation" className="text-foreground/80 hover:text-foreground">
                  Free consultation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@katalyx.io"
                  className="text-foreground/80 hover:text-foreground"
                >
                  contact@katalyx.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © {year} KATALYX. Built on proven transformation frameworks.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
