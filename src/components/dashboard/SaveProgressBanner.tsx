import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, X } from "lucide-react";

export default function SaveProgressBanner() {
  const { user, signUp } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user || dismissed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to verify your account." });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ff6b6b]/30 bg-gradient-to-r from-teal-600/10 via-background to-[#ff6b6b]/10 p-6 mb-8">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-muted-foreground/50 hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {!showForm ? (
        <div className="flex items-center gap-6">
          <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-[#ff6b6b] flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Save your assessment results</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create a free account to save your progress, track improvements over time, and generate your transformation backlog.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="shrink-0 bg-gradient-to-r from-teal-600 to-[#ff6b6b] text-white hover:opacity-90 border-0"
          >
            Create Account
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-[#ff6b6b] flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Create your account</h3>
              <p className="text-xs text-muted-foreground">Your assessment data will be saved automatically</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="save-name" className="text-xs">Full Name</Label>
              <Input
                id="save-name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-email" className="text-xs">Email</Label>
              <Input
                id="save-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-password" className="text-xs">Password</Label>
              <Input
                id="save-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-teal-600 to-[#ff6b6b] text-white hover:opacity-90 border-0"
            >
              {loading ? "Creating..." : "Save My Progress"}
            </Button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
