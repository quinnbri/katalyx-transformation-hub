import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <span className="font-display text-xs font-bold text-primary-foreground">K</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            KATALYX
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-5" asChild>
            <Link to="/login">Start Assessment</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
