import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700">
            <div className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-teal-600">KATALY</span>
            <span className="text-[#ff6b6b]">X</span>
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
