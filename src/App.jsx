import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";

import DarkModeProvider from "@configs/DarkModeProvider";
import AuthProvider from "@configs/AuthProvider";
import MainLayout from "@layouts/MainLayout";

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
import NotFound from "@pages/NotFound";
import ProtectedRoute from "@components/auth/ProtectedRoute";


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

//Route
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

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
              <VarianceAnalysis />
            </PageWrapper>
          }
        />

        <Route
          path="/excel-comparison"
          element={
            <PageWrapper>
              <ExcelComparison />
            </PageWrapper>
          }
        />

        <Route
          path="/gla-variance-analysis"
          element={
            <PageWrapper>
              <GLAVarianceAnalysis />
            </PageWrapper>
          }
        />

        <Route
          path="/contract-ocr"
          element={
            <PageWrapper>
              <ContractOCR />
            </PageWrapper>
          }
        />

        <Route
          path="/utility-billing"
          element={
            <PageWrapper>
              <UtilityBilling />
            </PageWrapper>
          }
        />

        <Route
          path="/bank-statement-parser"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <BankStatementParser />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bank-statement-parser/session/:sessionId"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <BankStatementSessionDetail />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-usage"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <AIUsageDashboard />
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
  );
}

//App
function App() {

  useEffect(() => {
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <DarkModeProvider>
          <TooltipProvider>
            <ScrollToTop />
            <MainLayout>
              <Toaster richColors position="top-center" />
              <AnimatedRoutes />
            </MainLayout>
          </TooltipProvider>
        </DarkModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
