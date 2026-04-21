import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedContextType {
  markOnboardingComplete: () => void;
}

const ProtectedContext = createContext<ProtectedContextType>({ markOnboardingComplete: () => {} });

export function useProtected() {
  return useContext(ProtectedContext);
}

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setCheckingProfile(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setOnboardingDone(!!(data as any)?.onboarding_completed);
        setCheckingProfile(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading || checkingProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Send new visitors to signup (acquisition-first) and remember where
    // they were trying to go so we can return them after auth.
    return <Navigate to="/signup" replace state={{ from: location }} />;
  }

  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return (
    <ProtectedContext.Provider value={{ markOnboardingComplete: () => setOnboardingDone(true) }}>
      <Outlet />
    </ProtectedContext.Provider>
  );
}
