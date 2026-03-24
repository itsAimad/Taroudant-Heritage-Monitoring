import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Monuments from "./pages/Monuments";
import Seismes from "./pages/Seismes";
import Inspections from "./pages/Inspections";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import UsersPage from "./pages/UsersPage";
import MonumentDetail from "./pages/MonumentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monuments" element={<Monuments />} />
            <Route path="/monuments/:id" element={<MonumentDetail />} />
            <Route path="/seismes" element={<Seismes />} />
            <Route path="/inspections" element={<Inspections />} />
            <Route path="/inspections/new" element={<Inspections />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
