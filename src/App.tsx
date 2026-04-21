import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";

// Landing loads eagerly so first paint is fast.
import Index from "./pages/Index";

// All other pages are lazy-loaded so landing visitors only
// download what they need.
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Agent = lazy(() => import("./pages/Agent"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Results = lazy(() => import("./pages/Results"));
const Benchmarks = lazy(() => import("./pages/Benchmarks"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const BusinessContext = lazy(() => import("./pages/BusinessContext"));
const Backlog = lazy(() => import("./pages/Backlog"));
const FrameworkDetail = lazy(() => import("./pages/FrameworkDetail"));
const SharedBacklog = lazy(() => import("./pages/SharedBacklog"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible defaults for an app that hits Supabase:
      staleTime: 60_000, // 1 minute
      gcTime: 5 * 60_000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div
      className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
      role="status"
      aria-label="Loading"
    />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/shared/:token" element={<SharedBacklog />} />

                  {/* Authenticated routes — ProtectedRoute enforces login + onboarding */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/agent" element={<Agent />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/assessment/:framework" element={<Assessment />} />
                    <Route path="/results/:assessmentId" element={<Results />} />
                    <Route path="/benchmarks" element={<Benchmarks />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route
                      path="/business-context/:assessmentId"
                      element={<BusinessContext />}
                    />
                    <Route path="/backlog/:sessionId" element={<Backlog />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
