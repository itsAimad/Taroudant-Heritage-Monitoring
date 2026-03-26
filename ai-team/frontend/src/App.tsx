import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import AppLoader from "@/components/ui/AppLoader";
import PageTransition from "@/components/ui/PageTransition";

const Home = React.lazy(() => import("@/pages/Home"));
const Login = React.lazy(() => import("@/pages/Login"));
const Monuments = React.lazy(() => import("@/pages/Monuments"));
const About = React.lazy(() => import("@/pages/About"));
const MonumentDetail = React.lazy(() => import("@/pages/MonumentDetail"));

// Dashboards
const InspectorDashboard = React.lazy(() => import("@/pages/inspector/InspectorDashboard"));
const AuthorityDashboard = React.lazy(() => import("@/pages/authority/AuthorityDashboard"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));

// Inspection Tools
const NewInspection = React.lazy(() => import("@/pages/inspector/NewInspection"));
const InspectionDetail = React.lazy(() => import("@/pages/inspector/InspectionDetail"));

const RiskLab = React.lazy(() => import("@/pages/RiskLab"));
const Analytics = React.lazy(() => import("@/pages/Analytics"));
const ArchitecturePage = React.lazy(() => import("@/pages/ArchitecturePage"));
const UserManagement = React.lazy(() => import("@/pages/UserManagement"));
const MapView = React.lazy(() => import("@/pages/MapView"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const InspectionView = React.lazy(() => import("@/pages/authority/InspectionView"));

const queryClient = new QueryClient();

// Role-based dashboard router
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'inspector') return <InspectorDashboard />;
  if (user?.role === 'authority') return <AuthorityDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <Navigate to="/" />;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<AppLoader static />}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/monuments"
            element={
              <PageTransition>
                <Monuments />
              </PageTransition>
            }
          />
          <Route path="/heritage" element={<Navigate to="/monuments" replace />} />
          <Route
            path="/monument/:id"
            element={
              <PageTransition>
                <MonumentDetail />
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <About />
              </PageTransition>
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <Login />
              </PageTransition>
            }
          />
          <Route
            path="/map"
            element={
              <PageTransition>
                <MapView />
              </PageTransition>
            }
          />
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route
              path="/dashboard"
              element={
                <PageTransition>
                  <DashboardRouter />
                </PageTransition>
              }
            />

            <Route
              path="/risk-lab"
              element={
                <PageTransition>
                  <RiskLab />
                </PageTransition>
              }
            />
            <Route
              path="/analytics"
              element={
                <PageTransition>
                  <Analytics />
                </PageTransition>
              }
            />
            <Route
              path="/architecture"
              element={
                <PageTransition>
                  <ArchitecturePage />
                </PageTransition>
              }
            />
          </Route>

          {/* Inspector + Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['inspector', 'admin']} />}>
            <Route
              path="/inspect/new"
              element={
                <PageTransition>
                  <NewInspection />
                </PageTransition>
              }
            />
            <Route
              path="/inspect/:id"
              element={
                <PageTransition>
                  <InspectionDetail />
                </PageTransition>
              }
            />
          </Route>

          {/* Authority + Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['authority', 'admin']} />}>
            <Route
              path="/inspection/:id"
              element={
                <PageTransition>
                  <InspectionView />
                </PageTransition>
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route
              path="/admin/users"
              element={
                <PageTransition>
                  <UserManagement />
                </PageTransition>
              }
            />
          </Route>
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            }
          />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Navbar />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <AppRoutes />
          </motion.div>
          {/* Top-level preloader overlay */}
          <AppLoader />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
