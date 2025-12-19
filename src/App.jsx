import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";

import DarkModeProvider from "@configs/DarkModeProvider";
import MainLayout from "@layouts/MainLayout";

import Home from "@pages/Home";
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
import AIUsageDashboard from "@pages/AIUsageDashboard";
import NotFound from "@pages/NotFound";


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
            <PageWrapper>
              <ProjectManagement />
            </PageWrapper>
          }
        />

        <Route
          path="/projects/:uuid"
          element={
            <PageWrapper>
              <ProjectWorkspace />
            </PageWrapper>
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
            <PageWrapper>
              <BankStatementParser />
            </PageWrapper>
          }
        />

        <Route
          path="/ai-usage"
          element={
            <PageWrapper>
              <AIUsageDashboard />
            </PageWrapper>
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
    <DarkModeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <MainLayout>
            <Toaster richColors position="top-center" />
            <AnimatedRoutes />
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </DarkModeProvider>
  );
}

export default App;
