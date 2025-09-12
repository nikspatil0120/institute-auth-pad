import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DemoModeBanner from "@/components/DemoModeBanner";
import { buildInstituteUrl } from "@/lib/institute-utils";
import { 
  FileText, 
  Eye, 
  Download, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Award, 
  GraduationCap,
  Calendar,
  User,
  Hash,
  Scan
} from "lucide-react";
import OCRProcessor from "@/components/OCRProcessor";
import { ParsedData } from "@/services/ocrService";

interface LegacyDocument {
  id: number;
  student_name: string;
  student_roll: string;
  doc_type: string;
  marks?: number;
  uin: string;
  date_issued: string;
  institute_name: string;
  status: 'unverified' | 'pending' | 'verified';
  blockchain_hash?: string;
  cert_id?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

const API_BASE_URL = "http://localhost:5000/api";

export default function LegacyDocumentManagement() {
  const { instituteName } = useParams<{ instituteName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<LegacyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOCR, setShowOCR] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegacyDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/legacy/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch legacy documents');
      }

      const data = await res.json();
      setDocuments(data.requests || []);
    } catch (error) {
      console.error('Error fetching legacy documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch legacy documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (docId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/legacy/requests/${docId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      const data = await res.json();
      toast({
        title: "Status Updated",
        description: `Document status updated to ${newStatus}`
      });

      // Refresh documents
      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status"
      });
    }
  };

  const handleOCRVerification = (data: ParsedData, document: LegacyDocument) => {
    // Compare OCR data with stored document data
    const comparison = {
      studentName: data.studentName === document.student_name,
      studentRoll: data.studentRoll === document.student_roll,
      docType: data.courseName === document.doc_type,
      uin: data.certificateNumber === document.uin || data.uin === document.uin,
      marks: data.marks === document.marks?.toString(),
      dateIssued: data.dateIssued === document.date_issued
    };

    const matches = Object.values(comparison).filter(Boolean).length;
    const total = Object.keys(comparison).length;
    const matchPercentage = Math.round((matches / total) * 100);

    toast({
      title: "OCR Verification Complete",
      description: `Document verification: ${matchPercentage}% match with stored data`,
    });

    setShowOCR(false);
    setSelectedDocument(null);

    // Auto-approve if high match percentage
    if (matchPercentage >= 80) {
      updateStatus(document.id, 'verified');
    }
  };

  const downloadDocument = async (docId: number, studentName: string, docType: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/legacy/download/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `legacy_${studentName.replace(/\s+/g, '_')}_${docType}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const viewDocument = (docId: number) => {
    window.open(`${API_BASE_URL}/legacy/view/${docId}`, "_blank");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'unverified':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'unverified':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <Award className="h-4 w-4" />;
      case 'marksheet':
        return <GraduationCap className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredDocuments = documents.filter(doc => 
    statusFilter === "all" || doc.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Navigation />
        <DemoModeBanner />
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Legacy Document Management</h1>
            <p className="text-muted-foreground">Manage legacy document verification requests</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={() => navigate(buildInstituteUrl('/dashboard', instituteName))}
              className="border-border/50"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-xl font-bold text-foreground">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-xl font-bold text-foreground">
                    {documents.filter(d => d.status === 'verified').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-foreground">
                    {documents.filter(d => d.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Table */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Legacy Document Requests</CardTitle>
                <CardDescription>
                  Review and manage legacy document verification requests
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-input border-border/50">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading legacy documents...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Document</TableHead>
                      <TableHead className="font-semibold">UIN</TableHead>
                      <TableHead className="font-semibold">Date Issued</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.student_name}</p>
                            <p className="text-sm text-muted-foreground">{doc.student_roll}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDocTypeIcon(doc.doc_type)}
                            <div>
                              <p className="capitalize font-medium">{doc.doc_type}</p>
                              {doc.marks && (
                                <p className="text-sm text-muted-foreground">Marks: {doc.marks}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {doc.uin}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-sm">
                              {new Date(doc.date_issued).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(doc.status)}
                              {doc.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDocument(doc.id)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadDocument(doc.id, doc.student_name, doc.doc_type)}
                              className={`h-8 w-8 p-0 ${
                                doc.status === 'verified' 
                                  ? 'hover:bg-primary/10' 
                                  : 'opacity-50 cursor-not-allowed'
                              }`}
                              disabled={doc.status !== 'verified'}
                              title={doc.status !== 'verified' ? 'Only verified documents can be downloaded' : 'Download document'}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setShowOCR(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              title="Verify with OCR"
                            >
                              <Scan className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(doc.id, 'verified')}
                                className={`h-8 px-3 text-xs ${
                                  doc.status === 'verified' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                    : 'hover:bg-green-500/10'
                                }`}
                                disabled={doc.status === 'verified'}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Correct
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(doc.id, 'unverified')}
                                className={`h-8 px-3 text-xs ${
                                  doc.status === 'unverified' 
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                    : 'hover:bg-red-500/10'
                                }`}
                                disabled={doc.status === 'unverified'}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Wrong
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredDocuments.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Legacy Documents</h3>
                    <p className="text-muted-foreground">
                      No legacy document requests found for the selected filter.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OCR Modal */}
        {showOCR && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">OCR Document Verification</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowOCR(false);
                      setSelectedDocument(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Verifying Document:</h3>
                  <p><strong>Student:</strong> {selectedDocument.student_name}</p>
                  <p><strong>Roll:</strong> {selectedDocument.student_roll}</p>
                  <p><strong>Type:</strong> {selectedDocument.doc_type}</p>
                  <p><strong>UIN:</strong> {selectedDocument.uin}</p>
                </div>
                <OCRProcessor
                  onDataExtracted={(data) => handleOCRVerification(data, selectedDocument)}
                  showFormFields={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
