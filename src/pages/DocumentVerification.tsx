import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { buildInstituteUrl } from "@/lib/institute-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Upload, FileText, Search, CheckCircle2, Lock, Verified, Hash, Calendar, User, GraduationCap, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DemoModeBanner from "@/components/DemoModeBanner";

// Form schemas
const documentIdSchema = z.object({
  cert_id: z.string().optional(),
  uin: z.string().optional(),
}).refine((data) => !!(data.cert_id || data.uin), {
  message: 'Provide either Certificate ID or UIN',
  path: ['cert_id'],
});

const fileUploadSchema = z.object({
  file: z.any().refine((file) => file && file[0], "PDF file is required"),
});

type DocumentIdFormData = z.infer<typeof documentIdSchema>;
type FileUploadFormData = z.infer<typeof fileUploadSchema>;

interface VerificationResult {
  status: "valid" | "invalid";
  document?: {
    id: number;
    doc_type: string;
    name: string;
    number?: string;
    exam_name?: string;
    marks?: string;
    issue_date: string;
    blockchain_hash: string;
    status: string;
    created_at: string;
  };
  verification_details?: {
    verified_at: string;
    method: string;
    blockchain_hash: string;
    ledger_timestamp: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

const API_BASE_URL = "http://localhost:5000/api";

// API function
const verifyDocument = async (data: { cert_id?: string; uin?: string; file?: File }): Promise<VerificationResult> => {
  let response;
  
  if (data.file) {
    // Handle file upload
    const formData = new FormData();
    formData.append("file", data.file);
    
    response = await fetch(`${API_BASE_URL}/verify_document`, {
      method: "POST",
      body: formData,
    });
  } else {
    // Handle document ID only
    response = await fetch(`${API_BASE_URL}/verify_document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cert_id: data.cert_id, uin: data.uin }),
    });
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Verification failed");
  }
  
  return response.json();
};

type DocumentVerificationProps = { minimal?: boolean; resultPath?: string };

export default function DocumentVerification({ minimal = false, resultPath = "/verify/result" }: DocumentVerificationProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { instituteName } = useParams<{ instituteName: string }>();
  const [activeTab, setActiveTab] = useState("document-id");
  const [dragOver, setDragOver] = useState(false);
  
  // Determine the correct result path based on context
  const getResultPath = () => {
    if (resultPath !== "/verify/result") {
      return resultPath; // Use provided path (e.g., for public verification)
    }
    if (instituteName) {
      return buildInstituteUrl("/verify/result", instituteName);
    }
    return resultPath; // Fallback to default
  };

  // Form handlers
  const documentIdForm = useForm<DocumentIdFormData>({
    resolver: zodResolver(documentIdSchema),
  });

  const fileUploadForm = useForm<FileUploadFormData>({
    resolver: zodResolver(fileUploadSchema),
  });

  // Verification mutation
  const verifyMutation = useMutation({
    mutationFn: verifyDocument,
    onSuccess: (result) => {
      // Navigate to results page with verification data
      navigate(getResultPath(), { 
        state: { 
          result,
          method: activeTab === "document-id" ? "Document ID" : "File Upload",
          input: activeTab === "document-id" ? (documentIdForm.getValues("cert_id") || documentIdForm.getValues("uin") || "") : "Uploaded File"
        } 
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message,
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileUploadForm.setValue("file", [file]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === "application/pdf");
    
    if (pdfFile) {
      fileUploadForm.setValue("file", [pdfFile]);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a valid PDF file.",
      });
    }
  };

  const onSubmitDocumentId = (data: DocumentIdFormData) => {
    verifyMutation.mutate({ cert_id: data.cert_id, uin: data.uin });
  };

  const onSubmitFileUpload = (data: FileUploadFormData) => {
    verifyMutation.mutate({ file: data.file[0] });
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case "certificate":
        return <Award className="h-4 w-4" />;
      case "marksheet":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {!minimal && <Navigation />}
        {!minimal && <DemoModeBanner />}
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-green-500/20 border-2 border-green-500/30">
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Document Verification</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify the authenticity of documents, certificates, and marksheets issued by educational institutions. 
            Our blockchain-based verification ensures complete transparency and trust.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm border-green-500/20 shadow-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Blockchain Verified</h3>
              <p className="text-sm text-muted-foreground">Tamper-proof verification</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-blue-500/20 shadow-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Your data is protected</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-purple-500/20 shadow-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Verified className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Instant Results</h3>
              <p className="text-sm text-muted-foreground">Real-time verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Options */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Search className="h-6 w-6 text-primary" />
              Verify Document
            </CardTitle>
            <CardDescription className="text-base">
              Choose your preferred verification method below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="document-id" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Doc/Cert ID
                </TabsTrigger>
                <TabsTrigger value="upload-pdf" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="document-id" className="space-y-4">
                <form onSubmit={documentIdForm.handleSubmit(onSubmitDocumentId)} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Enter Certificate ID or UIN
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        id="cert-id"
                        type="text"
                        placeholder="Certificate ID (e.g., 59a0106d8a5e6908)"
                        {...documentIdForm.register("cert_id")}
                        className="h-12 text-base bg-input border-border/50 focus:border-green-500/50 focus:ring-green-500/20"
                      />
                      <Input
                        id="uin"
                        type="text"
                        placeholder="UIN (for Documents/Marksheets)"
                        {...documentIdForm.register("uin")}
                        className="h-12 text-base bg-input border-border/50 focus:border-green-500/50 focus:ring-green-500/20"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use either the generated Certificate ID or the UIN (for documents/marksheets).
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    size="lg"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Verifying Document...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-3" />
                        Verify Document
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="upload-pdf" className="space-y-4">
                <form onSubmit={fileUploadForm.handleSubmit(onSubmitFileUpload)} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Upload Document PDF</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                        dragOver 
                          ? "border-green-500 bg-green-500/5" 
                          : fileUploadForm.watch("file") && fileUploadForm.watch("file")[0]
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-border hover:border-green-500/50 hover:bg-green-500/5"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {fileUploadForm.watch("file") && fileUploadForm.watch("file")[0] ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <div className="p-3 rounded-full bg-green-500/20">
                              <FileText className="h-8 w-8 text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{fileUploadForm.watch("file")[0].name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(fileUploadForm.watch("file")[0].size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileUploadForm.setValue("file", [])}
                            className="mt-2 border-border/50 hover:bg-muted/20 text-sm"
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-lg font-medium mb-2">Drop your PDF document here</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              or click to browse files
                            </p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="pdf-upload"
                          />
                          <Button asChild variant="outline" className="border-green-500/50 hover:bg-green-500/10 text-green-400">
                            <label htmlFor="pdf-upload" className="cursor-pointer">
                              Choose PDF File
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                    {fileUploadForm.formState.errors.file && (
                      <p className="text-sm text-destructive">{String(fileUploadForm.formState.errors.file.message)}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Upload your original document PDF file for verification.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={verifyMutation.isPending || !fileUploadForm.watch("file")}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    size="lg"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Verifying Document...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-3" />
                        Verify Document
                      </>
                    )}
                  </Button>
                  
                  {!fileUploadForm.watch("file") && (
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      Upload a PDF file to continue
                    </p>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Information */}
        <div className="text-center space-y-4 pt-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            This verification system is powered by blockchain technology to ensure complete authenticity.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>🔒 SSL Encrypted</span>
            <span>⚡ Instant Verification</span>
            <span>🛡️ Blockchain Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
