import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentManagementPage from "./pages/StudentManagement";
import CertificateIssuancePage from "./pages/CertificateIssuance";
import CertificatesDashboardPage from "./pages/CertificatesDashboard";
import CertificateVerificationPage from "./pages/CertificateVerification";
import VerificationResultPage from "./pages/VerificationResult";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/students" element={<StudentManagementPage />} />
          <Route path="/certificates" element={<CertificateIssuancePage />} />
          <Route path="/dashboard" element={<CertificatesDashboardPage />} />
          <Route path="/verify" element={<CertificateVerificationPage />} />
          <Route path="/verify/result" element={<VerificationResultPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
