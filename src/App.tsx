import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Benchmarks from "./pages/Benchmarks";
import Onboarding from "./pages/Onboarding";
import BusinessContext from "./pages/BusinessContext";
import Backlog from "./pages/Backlog";
import SharedBacklog from "./pages/SharedBacklog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessment/:framework" element={<Assessment />} />
            <Route path="/results/:assessmentId" element={<Results />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/business-context/:assessmentId" element={<BusinessContext />} />
            <Route path="/backlog/:sessionId" element={<Backlog />} />
            <Route path="/shared/:token" element={<SharedBacklog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
