import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import HeritageExplorer from "@/pages/HeritageExplorer";
import About from "@/pages/About";
import Dashboard from "@/pages/Dashboard";
import MonumentDetail from "@/pages/MonumentDetail";
import RiskLab from "@/pages/RiskLab";
import Analytics from "@/pages/Analytics";
import ArchitecturePage from "@/pages/ArchitecturePage";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/heritage" element={<HeritageExplorer />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/monument/:id" element={<MonumentDetail />} />
              <Route path="/risk-lab" element={<RiskLab />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
            </Route>
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/users" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
