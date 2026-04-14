import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FeedingProvider } from "@/context/FeedingContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Countdown from "./pages/Countdown";
import Schedule from "./pages/Schedule";
import ProgressPage from "./pages/Progress";
import SettingsPage from "./pages/Settings";
import Camera from "./pages/Camera";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FeedingProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/countdown" element={<Countdown />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/camera" element={<Camera />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </FeedingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
