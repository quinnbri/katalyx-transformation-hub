import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import katalyxLogo from "@/assets/katalyx-icon-only.svg";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={katalyxLogo} alt="Katalyx logo" className="h-10 w-10" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground/60">
            KATALYX
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Login
          </Link>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5" asChild>
            <Link to="/login">Start Assessment</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
