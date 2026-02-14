import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-coral-400"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-coral-400 bg-clip-text text-transparent">
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
