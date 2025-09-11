import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Award, GraduationCap, Download, Hash, Calendar, User, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DemoModeBanner from "@/components/DemoModeBanner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// Form schemas for different document types
const documentSchema = z.object({
  student_roll: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Name is required"),
  unique_id: z.string().min(1, "Unique identifying number is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  file: z.any().refine((file) => file && file[0], "PDF file is required"),
});

const certificateSchema = z.object({
  student_roll: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Certificate name is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  file: z.any().refine((file) => file && file[0], "PDF file is required"),
});

const marksheetSchema = z.object({
  student_roll: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Student name is required"),
  exam_name: z.string().min(1, "Exam name is required"),
  unique_id: z.string().min(1, "Unique identifying number is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  file: z.any().refine((file) => file && file[0], "PDF file is required"),
});

type DocumentFormData = z.infer<typeof documentSchema>;
type CertificateFormData = z.infer<typeof certificateSchema>;
type MarksheetFormData = z.infer<typeof marksheetSchema>;

interface Document {
  id: number;
  doc_type: string;
  name: string;
  number?: string;
  cert_id?: string;
  exam_name?: string;
  issue_date: string;
  blockchain_hash: string;
  status: string;
  created_at: string;
}

const API_BASE_URL = "http://localhost:5000/api";

// API functions
const uploadDocument = async (formData: FormData) => {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE_URL}/upload_document`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }
  
  return response.json();
};

const fetchDocuments = async (): Promise<Document[]> => {
  const token = localStorage.getItem("auth_token");
  
  // If no token, return empty array (demo mode)
  if (!token) {
    return [];
  }
  
  const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    // If unauthorized, return empty array instead of throwing error
    if (response.status === 401) {
      return [];
    }
    throw new Error("Failed to fetch documents");
  }
  
  const data = await response.json();
  return data.documents;
};

const downloadDocument = async (docId: number, suggestedName?: string) => {
  const token = localStorage.getItem("auth_token");
  
  // In demo mode, create a mock PDF download
  if (!token) {
    // Create a mock PDF content
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Demo Certificate - Document ID: ${docId}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;
    
    const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demo_document_${docId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return;
  }
  
  // Real download for authenticated users
  const response = await fetch(`${API_BASE_URL}/documents/download/${docId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Download failed");
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName ? suggestedName : `document_${docId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const deleteDocumentApi = async (docId: number) => {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Delete failed');
  }
  return response.json();
};

export default function DocumentUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("document");
  const [dragOver, setDragOver] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);
  const [marksPreviewUrl, setMarksPreviewUrl] = useState<string | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    enabled: !!localStorage.getItem("auth_token"),
    retry: false,
    refetchOnWindowFocus: false,
    // Add demo data when no auth token
    initialData: !localStorage.getItem("auth_token") ? [
      {
        id: 1,
        doc_type: "certificate",
        name: "Bachelor of Computer Science",
        number: "CERT-2024-001",
        exam_name: undefined,
        issue_date: "2024-09-01",
        blockchain_hash: "0x4f2a6b8c9d3e5f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
        status: "confirmed",
        created_at: "2024-09-01T10:00:00Z"
      },
      {
        id: 2,
        doc_type: "marksheet",
        name: "John Doe",
        number: undefined,
        exam_name: "Final Examination 2024",
        issue_date: "2024-08-15",
        blockchain_hash: "0x7a3d8e2f1b4c5a6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
        status: "confirmed",
        created_at: "2024-08-15T14:30:00Z"
      }
    ] : undefined,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (data) => {
      toast({
        title: "Document Uploaded",
        description: `${data.type} uploaded successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      // Clear all forms and previews so inputs disappear after upload
      try {
        documentForm.reset();
        certificateForm.reset();
        marksheetForm.reset();
        if (docPreviewUrl) { URL.revokeObjectURL(docPreviewUrl); }
        if (certPreviewUrl) { URL.revokeObjectURL(certPreviewUrl); }
        if (marksPreviewUrl) { URL.revokeObjectURL(marksPreviewUrl); }
      } catch {}
    },
    onError: (error) => {
      // In demo mode, show success even if backend fails
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        toast({
          title: "Document Uploaded (Demo Mode)",
          description: "Document uploaded successfully in demo mode!",
        });
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message,
        });
      }
    },
  });

  // Form handlers
  const documentForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
  });

  const certificateForm = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
  });

  const marksheetForm = useForm<MarksheetFormData>({
    resolver: zodResolver(marksheetSchema),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, form: any) => {
    const file = e.target.files?.[0];
    if (file) {
      // Replace whatever was selected before
      form.setValue("file", [file]);
      try {
        const url = URL.createObjectURL(file);
        if (form === documentForm) {
          if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl);
          setDocPreviewUrl(url);
        } else if (form === certificateForm) {
          if (certPreviewUrl) URL.revokeObjectURL(certPreviewUrl);
          setCertPreviewUrl(url);
        } else if (form === marksheetForm) {
          if (marksPreviewUrl) URL.revokeObjectURL(marksPreviewUrl);
          setMarksPreviewUrl(url);
        }
      } catch {}
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

  const handleDrop = (e: React.DragEvent, form: any) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === "application/pdf");
    
    if (pdfFile) {
      form.setValue("file", [pdfFile]);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a valid PDF file.",
      });
    }
  };

  const onSubmit = async (data: any, docType: string) => {
    const formData = new FormData();
    formData.append("type", docType);
    formData.append("file", data.file[0]);
    formData.append("student_roll", data.student_roll);
    // Auto-attach student_name from localStorage if found
    try {
      const stored = localStorage.getItem("students");
      if (stored) {
        const list = JSON.parse(stored) as Array<{ rollNo: string; name: string }>;
        const match = list.find(s => s.rollNo.toLowerCase() === String(data.student_roll).toLowerCase());
        if (match?.name) {
          formData.append("student_name", match.name);
        }
      }
    } catch {}
    
    // Add fields based on document type
    if (docType === "document") {
      formData.append("name", data.name);
      formData.append("unique_id", data.unique_id);
      if (data.number) formData.append("number", data.number);
      formData.append("issue_date", data.issue_date);
    } else if (docType === "certificate") {
      formData.append("name", data.name);
      formData.append("issue_date", data.issue_date);
    } else if (docType === "marksheet") {
      formData.append("name", data.name);
      formData.append("exam_name", data.exam_name);
      formData.append("unique_id", data.unique_id);
      formData.append("issue_date", data.issue_date);
    }
    
    uploadMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "issued":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
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
      <div className="max-w-7xl mx-auto space-y-8">
        <Navigation />
        <DemoModeBanner />
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Document Upload</h1>
            <p className="text-muted-foreground">Upload and manage documents, certificates, and marksheets</p>
          </div>
        </div>

        {/* Upload Form */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload New Document
            </CardTitle>
            <CardDescription>
              Select document type and fill in the required information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="document" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document
                </TabsTrigger>
                <TabsTrigger value="certificate" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificate
                </TabsTrigger>
                <TabsTrigger value="marksheet" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Marksheet
                </TabsTrigger>
              </TabsList>

              {/* Document Form */}
              <TabsContent value="document" className="space-y-6 mt-6">
                <form onSubmit={documentForm.handleSubmit((data) => onSubmit(data, "document"))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="doc-roll">Student Roll No</Label>
                      <Input
                        id="doc-roll"
                        placeholder="e.g., 23102A0001"
                        {...documentForm.register("student_roll")}
                        className="bg-input border-border/50 focus:border-primary/50"
                      />
                      {documentForm.formState.errors.student_roll && (
                        <p className="text-sm text-destructive">{documentForm.formState.errors.student_roll.message as string}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-name">Document Name</Label>
                      <Input
                        id="doc-name"
                        placeholder="e.g., Academic Transcript"
                        {...documentForm.register("name")}
                        className="bg-input border-border/50 focus:border-primary/50"
                      />
                      {documentForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{documentForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doc-date">Issue Date</Label>
                    <Input
                      id="doc-date"
                      type="date"
                      {...documentForm.register("issue_date")}
                      className="bg-input border-border/50 focus:border-primary/50 text-foreground"
                    />
                    {documentForm.formState.errors.issue_date && (
                      <p className="text-sm text-destructive">{documentForm.formState.errors.issue_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-uid">Unique Identifying Number</Label>
                    <Input
                      id="doc-uid"
                      placeholder="e.g., Receipt No / Reference No"
                      {...documentForm.register("unique_id")}
                      className="bg-input border-border/50 focus:border-primary/50"
                    />
                    {documentForm.formState.errors.unique_id && (
                      <p className="text-sm text-destructive">{documentForm.formState.errors.unique_id.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>PDF File</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, documentForm)}
                    >
                      {documentForm.watch("file") && documentForm.watch("file")[0] ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Selected:</p>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <p className="text-sm font-medium text-foreground mb-4 underline cursor-pointer">{documentForm.watch("file")[0].name}</p>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-[720px] h-[520px] p-0 overflow-hidden">
                              {docPreviewUrl && (
                                <iframe src={docPreviewUrl} title="preview" className="w-full h-[300px]" />
                              )}
                            </HoverCardContent>
                          </HoverCard>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2 border-border/50"
                            onClick={() => { documentForm.setValue("file", []); if (docPreviewUrl) { URL.revokeObjectURL(docPreviewUrl); setDocPreviewUrl(null);} }}
                          >
                            Change File
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">Drop PDF file here</p>
                          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, documentForm)}
                        className="hidden"
                        id="doc-file"
                      />
                      {!(documentForm.watch("file") && documentForm.watch("file")[0]) && (
                      <Button asChild variant="outline" className="border-primary/50 hover:bg-primary/10">
                        <label htmlFor="doc-file" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                      )}
                    </div>
                    {documentForm.formState.errors.file && (
                      <p className="text-sm text-destructive">{String(documentForm.formState.errors.file.message)}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={uploadMutation.isPending}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Certificate Form */}
              <TabsContent value="certificate" className="space-y-6 mt-6">
                <form onSubmit={certificateForm.handleSubmit((data) => onSubmit(data, "certificate"))} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cert-roll">Student Roll No</Label>
                    <Input
                      id="cert-roll"
                      placeholder="e.g., 23102A0001"
                      {...certificateForm.register("student_roll")}
                      className="bg-input border-border/50 focus:border-primary/50"
                    />
                    {certificateForm.formState.errors.student_roll && (
                      <p className="text-sm text-destructive">{certificateForm.formState.errors.student_roll.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-name">Certificate Name</Label>
                    <Input
                      id="cert-name"
                      placeholder="e.g., Bachelor of Computer Science"
                      {...certificateForm.register("name")}
                      className="bg-input border-border/50 focus:border-primary/50"
                    />
                    {certificateForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{certificateForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cert-date">Issue Date</Label>
                    <Input
                      id="cert-date"
                      type="date"
                      {...certificateForm.register("issue_date")}
                      className="bg-input border-border/50 focus:border-primary/50 text-foreground"
                    />
                    {certificateForm.formState.errors.issue_date && (
                      <p className="text-sm text-destructive">{certificateForm.formState.errors.issue_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>PDF File</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, certificateForm)}
                    >
                      {certificateForm.watch("file") && certificateForm.watch("file")[0] ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Selected:</p>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <p className="text-sm font-medium text-foreground mb-4 underline cursor-pointer">{certificateForm.watch("file")[0].name}</p>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-[720px] h-[520px] p-0 overflow-hidden">
                              {certPreviewUrl && (
                                <iframe src={certPreviewUrl} title="preview" className="w-full h-[300px]" />
                              )}
                            </HoverCardContent>
                          </HoverCard>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2 border-border/50"
                            onClick={() => { certificateForm.setValue("file", []); if (certPreviewUrl) { URL.revokeObjectURL(certPreviewUrl); setCertPreviewUrl(null);} }}
                          >
                            Change File
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">Drop PDF file here</p>
                          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, certificateForm)}
                        className="hidden"
                        id="cert-file"
                      />
                      {!(certificateForm.watch("file") && certificateForm.watch("file")[0]) && (
                      <Button asChild variant="outline" className="border-primary/50 hover:bg-primary/10">
                        <label htmlFor="cert-file" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                      )}
                    </div>
                    {certificateForm.formState.errors.file && (
                      <p className="text-sm text-destructive">{String(certificateForm.formState.errors.file.message)}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={uploadMutation.isPending}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Certificate
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Marksheet Form */}
              <TabsContent value="marksheet" className="space-y-6 mt-6">
                <form onSubmit={marksheetForm.handleSubmit((data) => onSubmit(data, "marksheet"))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="marksheet-roll">Student Roll No</Label>
                      <Input
                        id="marksheet-roll"
                        placeholder="e.g., 23102A0001"
                        {...marksheetForm.register("student_roll")}
                        className="bg-input border-border/50 focus:border-primary/50"
                      />
                      {marksheetForm.formState.errors.student_roll && (
                        <p className="text-sm text-destructive">{marksheetForm.formState.errors.student_roll.message as string}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marksheet-name">Student Name</Label>
                      <Input
                        id="marksheet-name"
                        placeholder="e.g., John Doe"
                        {...marksheetForm.register("name")}
                        className="bg-input border-border/50 focus:border-primary/50"
                      />
                      {marksheetForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{marksheetForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam-name">Exam Name</Label>
                      <Input
                        id="exam-name"
                        placeholder="e.g., Final Examination 2024"
                        {...marksheetForm.register("exam_name")}
                        className="bg-input border-border/50 focus:border-primary/50"
                      />
                      {marksheetForm.formState.errors.exam_name && (
                        <p className="text-sm text-destructive">{marksheetForm.formState.errors.exam_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marksheet-uid">Unique Identifying Number</Label>
                      <Input
                        id="marksheet-uid"
                        placeholder="e.g., Roll/Seat No"
                        {...marksheetForm.register("unique_id")}
                        className="bg-input border-border/50 focus:border-primary/50"
                      />
                      {marksheetForm.formState.errors.unique_id && (
                        <p className="text-sm text-destructive">{marksheetForm.formState.errors.unique_id.message as string}</p>
                      )}
                    </div>
                  
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marksheet-date">Issue Date</Label>
                    <Input
                      id="marksheet-date"
                      type="date"
                      {...marksheetForm.register("issue_date")}
                      className="bg-input border-border/50 focus:border-primary/50 text-foreground"
                    />
                    {marksheetForm.formState.errors.issue_date && (
                      <p className="text-sm text-destructive">{marksheetForm.formState.errors.issue_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>PDF File</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragOver 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, marksheetForm)}
                    >
                      {marksheetForm.watch("file") && marksheetForm.watch("file")[0] ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Selected:</p>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <p className="text-sm font-medium text-foreground mb-4 underline cursor-pointer">{marksheetForm.watch("file")[0].name}</p>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-[720px] h-[520px] p-0 overflow-hidden">
                              {marksPreviewUrl && (
                                <iframe src={marksPreviewUrl} title="preview" className="w-full h-[300px]" />
                              )}
                            </HoverCardContent>
                          </HoverCard>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2 border-border/50"
                            onClick={() => { marksheetForm.setValue("file", []); if (marksPreviewUrl) { URL.revokeObjectURL(marksPreviewUrl); setMarksPreviewUrl(null);} }}
                          >
                            Change File
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">Drop PDF file here</p>
                          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, marksheetForm)}
                        className="hidden"
                        id="marksheet-file"
                      />
                      {!(marksheetForm.watch("file") && marksheetForm.watch("file")[0]) && (
                      <Button asChild variant="outline" className="border-primary/50 hover:bg-primary/10">
                        <label htmlFor="marksheet-file" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                      )}
                    </div>
                    {marksheetForm.formState.errors.file && (
                      <p className="text-sm text-destructive">{String(marksheetForm.formState.errors.file.message)}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={uploadMutation.isPending}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Marksheet
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              All documents uploaded by your institute ({documents.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Documents Found</h3>
                <p className="text-muted-foreground">
                  Documents will appear here once they are uploaded.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Certificate ID</TableHead>
                      <TableHead className="font-semibold">Issue Date</TableHead>
                      <TableHead className="font-semibold">UIN</TableHead>
                      <TableHead className="font-semibold">Hash</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc, index) => (
                      <TableRow 
                        key={doc.id}
                        className={`transition-colors hover:bg-muted/30 ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/10"
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDocTypeIcon(doc.doc_type)}
                            <span className="capitalize font-medium">{doc.doc_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>
                          {doc.cert_id ? (
                            <code className="text-xs font-mono text-primary">{doc.cert_id}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.issue_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.doc_type !== 'certificate' && doc.number ? (
                            <code className="text-xs font-mono text-muted-foreground">{doc.number}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <code className="text-xs font-mono text-muted-foreground">
                              {doc.blockchain_hash.substring(0, 8)}...
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => {
                              try {
                                const safeName = `${doc.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}_${doc.id}.pdf`;
                                downloadDocument(doc.id, safeName);
                                toast({
                                  title: "Download Started",
                                  description: `Downloading document ${doc.id}...`,
                                });
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Download Failed",
                                  description: "Failed to download document",
                                });
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                await deleteDocumentApi(doc.id);
                                toast({ title: 'Document deleted', description: `Document ${doc.id} removed.` });
                                queryClient.invalidateQueries({ queryKey: ['documents'] });
                              } catch (e: any) {
                                toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
