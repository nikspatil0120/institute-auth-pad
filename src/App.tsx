import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentManagementPage from "./pages/StudentManagement";
import CertificatesDashboardPage from "./pages/CertificatesDashboard";
import DocumentVerificationPage from "./pages/DocumentVerification";
import DocumentUploadPage from "./pages/DocumentUpload";
import VerificationResultPage from "./pages/VerificationResult";
import StudentDocuments from "./pages/StudentDocuments";
import StudentLogin from "./pages/StudentLogin";
import VerifyPublic from "./pages/VerifyPublic";
import VerificationResultPublic from "./pages/VerificationResultPublic";
import AuthForm from "./components/AuthForm";
import StudentDocumentsAdmin from "./pages/StudentDocumentsAdmin";
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
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/login" element={<AuthForm />} />
          <Route path="/dashboard" element={<CertificatesDashboardPage />} />
          <Route path="/upload" element={<DocumentUploadPage />} />
          <Route path="/verify" element={<DocumentVerificationPage />} />
          <Route path="/verify-public" element={<VerifyPublic />} />
          <Route path="/verify/result" element={<VerificationResultPage />} />
          <Route path="/verify-public/result" element={<VerificationResultPublic />} />
          <Route path="/students/:roll" element={<StudentDocuments />} />
          <Route path="/admin/students/:roll" element={<StudentDocumentsAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
