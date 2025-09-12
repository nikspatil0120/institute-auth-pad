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
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRegisterInstitute from "./pages/AdminRegisterInstitute";
import LegacyDocumentRequest from "./pages/LegacyDocumentRequest";
import LegacyDocumentSearch from "./pages/LegacyDocumentSearch";
import LegacyDocumentManagement from "./pages/LegacyDocumentManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/login" element={<AuthForm />} />
          <Route path="/verify-public" element={<VerifyPublic />} />
          <Route path="/verify-public/result" element={<VerificationResultPublic />} />
          <Route path="/students/:roll" element={<StudentDocuments />} />
          
          {/* Legacy Document routes */}
          <Route path="/legacy-request" element={<LegacyDocumentRequest />} />
          <Route path="/legacy-search" element={<LegacyDocumentSearch />} />
          
          {/* Institute-specific routes */}
          <Route path="/institute/:instituteName/students" element={<StudentManagementPage />} />
          <Route path="/institute/:instituteName/dashboard" element={<CertificatesDashboardPage />} />
          <Route path="/institute/:instituteName/upload" element={<DocumentUploadPage />} />
          <Route path="/institute/:instituteName/verify" element={<DocumentVerificationPage />} />
          <Route path="/institute/:instituteName/verify/result" element={<VerificationResultPage />} />
          <Route path="/institute/:instituteName/students/:roll" element={<StudentDocumentsAdmin />} />
          <Route path="/institute/:instituteName/legacy" element={<LegacyDocumentManagement />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/register-institute" element={<AdminRegisterInstitute />} />
          <Route path="/admin/students/:roll" element={<StudentDocumentsAdmin />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
