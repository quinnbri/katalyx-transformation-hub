import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setOnboardingDone(!!(data as any)?.onboarding_completed);
        setCheckingProfile(false);
      });
  }, [user]);

  if (loading || checkingProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Allow onboarding page through; redirect others to onboarding if not completed
  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
