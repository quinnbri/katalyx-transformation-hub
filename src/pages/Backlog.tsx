import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Backlog() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl py-10 text-center">
        <h1 className="font-display text-2xl font-bold">Transformation Backlog</h1>
        <p className="mt-2 text-muted-foreground">
          Session: {sessionId}
        </p>
        <p className="mt-8 text-muted-foreground">
          Backlog generation coming soon...
        </p>
      </main>
    </div>
  );
}
