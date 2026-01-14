import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";

import DarkModeProvider from "@configs/DarkModeProvider";
import AuthProvider, { useAuth } from "@configs/AuthProvider";
import SettingsProvider from "@configs/SettingsProvider";
import MainLayout from "@layouts/MainLayout";
import AdminLayout from "@layouts/AdminLayout";

import Home from "@pages/Home";
import Login from "@pages/Login";
import AuthCallback from "@pages/AuthCallback";
import Department from "@pages/Department";
import Project from "@pages/Project";
import ProjectManagement from "@pages/ProjectManagement";
import ProjectWorkspace from "@pages/ProjectWorkspace";
import VarianceAnalysis from "@pages/VarianceAnalysis";
import ExcelComparison from "@pages/ExcelComparison";
import GLAVarianceAnalysis from "@pages/GLAVarianceAnalysis";
import ContractOCR from "@pages/ContractOCR";
import UtilityBilling from "@pages/UtilityBilling";
import BankStatementParser from "@pages/BankStatementParser";
import BankStatementSessionDetail from "@pages/BankStatementSessionDetail";
import AIUsageDashboard from "@pages/AIUsageDashboard";
import AdminUsers from "@pages/AdminUsers";
import AdminDashboard from "@pages/admin/AdminDashboard";
import AdminCases from "@pages/admin/AdminCases";
import AdminSettings from "@pages/admin/AdminSettings";
import NotFound from "@pages/NotFound";
import ProtectedRoute from "@components/auth/ProtectedRoute";
import FeatureGate from "@components/FeatureGate";


// Scroll to top on route change
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
}

// animation wrapper
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-[80vh]"
    >
      {children}
    </motion.div>
  );
}

// Admin Route wrapper - redirects non-admin users
function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

// User Routes (with MainLayout)
function UserRoutes() {
  const location = useLocation();

  return (
    <MainLayout>
      <Toaster richColors position="top-center" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />

          <Route
            path="/department"
            element={
              <PageWrapper>
                <Department />
              </PageWrapper>
            }
          />

          <Route
            path="/project/:departmentId"
            element={
              <PageWrapper>
                <Project />
              </PageWrapper>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <ProjectManagement />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:uuid"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <ProjectWorkspace />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/variance-analysis"
            element={
              <PageWrapper>
                <FeatureGate featureKey="varianceAnalysis">
                  <VarianceAnalysis />
                </FeatureGate>
              </PageWrapper>
            }
          />

          <Route
            path="/excel-comparison"
            element={
              <PageWrapper>
                <FeatureGate featureKey="excelComparison">
                  <ExcelComparison />
                </FeatureGate>
              </PageWrapper>
            }
          />

          <Route
            path="/gla-variance-analysis"
            element={
              <PageWrapper>
                <FeatureGate featureKey="glaAnalysis">
                  <GLAVarianceAnalysis />
                </FeatureGate>
              </PageWrapper>
            }
          />

          <Route
            path="/contract-ocr"
            element={
              <PageWrapper>
                <FeatureGate featureKey="contractOcr">
                  <ContractOCR />
                </FeatureGate>
              </PageWrapper>
            }
          />

          <Route
            path="/utility-billing"
            element={
              <PageWrapper>
                <FeatureGate featureKey="utilityBilling">
                  <UtilityBilling />
                </FeatureGate>
              </PageWrapper>
            }
          />

          <Route
            path="/bank-statement-parser"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <FeatureGate featureKey="bankStatementOcr">
                    <BankStatementParser />
                  </FeatureGate>
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bank-statement-parser/session/:sessionId"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <FeatureGate featureKey="bankStatementOcr">
                    <BankStatementSessionDetail />
                  </FeatureGate>
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <PageWrapper>
                <NotFound />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </MainLayout>
  );
}

// Admin Routes (with AdminLayout)
function AdminRoutes() {
  return (
    <AdminRoute>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/cases" element={<AdminCases />} />
        <Route path="/ai-usage" element={<AIUsageDashboard />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminRoute>
  );
}

// Main App Routes
function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Routes location={location}>
        {/* Public Auth Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Admin Routes - AdminLayout */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* User Routes - MainLayout */}
        <Route path="/*" element={<UserRoutes />} />
      </Routes>
    </>
  );
}

//App
function App() {
  useEffect(() => {
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <DarkModeProvider>
            <TooltipProvider>
              <AppRoutes />
            </TooltipProvider>
          </DarkModeProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
