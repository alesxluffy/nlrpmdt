import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SOP from "./pages/SOP";
import Roster from "./pages/Roster";
import NewIncident from "./pages/NewIncident";
import IncidentHistory from "./pages/IncidentHistory";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/sop" element={<MainLayout><SOP /></MainLayout>} />
            <Route path="/roster" element={<MainLayout><Roster /></MainLayout>} />
            <Route path="/incidents/new" element={<MainLayout><NewIncident /></MainLayout>} />
            <Route path="/incidents" element={<MainLayout><IncidentHistory /></MainLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
