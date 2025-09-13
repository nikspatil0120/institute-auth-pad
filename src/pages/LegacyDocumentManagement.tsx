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
  Shield,
  AlertTriangle,
  Trash2
} from "lucide-react";
import FraudDetectionAlert from "@/components/FraudDetectionAlert";
import FraudAnalysisModal from "@/components/FraudAnalysisModal";
import fraudDetectionService, { FraudAnalysis } from "@/services/fraudDetectionService";

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
  fraud_risk?: string;
  fraud_score?: number;
  fraud_analysis?: string;
  requires_manual_review?: boolean;
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
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(null);
  const [showFraudAnalysis, setShowFraudAnalysis] = useState(false);
  const [isAnalyzingFraud, setIsAnalyzingFraud] = useState(false);

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

  const deleteDocument = async (documentId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/legacy/requests/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        toast({
          title: "Document Deleted",
          description: "Document has been successfully deleted from the database."
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete document');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete document"
      });
    }
  };

  const analyzeFraud = async (document: LegacyDocument) => {
    try {
      setIsAnalyzingFraud(true);
      const fraudResult = await fraudDetectionService.validateDocument(document.id);
      setFraudAnalysis(fraudResult);
      setShowFraudAnalysis(true);
      
      // Save fraud analysis to database
      try {
        await fetch(`${API_BASE_URL}/legacy/requests/${document.id}/fraud-analysis`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fraud_risk: fraudResult.risk_level,
            fraud_score: fraudResult.fraud_probability,
            fraud_analysis: JSON.stringify(fraudResult),
            requires_manual_review: fraudResult.risk_level === 'HIGH' || fraudResult.risk_level === 'MEDIUM'
          })
        });
      } catch (error) {
        console.error('Failed to save fraud analysis:', error);
      }
      
      // Update document in local state
      setDocuments(prev => prev.map(doc => 
        doc.id === document.id 
          ? { ...doc, fraud_risk: fraudResult.risk_level, fraud_score: fraudResult.fraud_probability }
          : doc
      ));
      
      toast({
        title: "Fraud Analysis Complete",
        description: `Document shows ${fraudResult.risk_level.toLowerCase()} fraud risk.`
      });
    } catch (error) {
      console.error('Fraud analysis failed:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to analyze document for fraud."
      });
    } finally {
      setIsAnalyzingFraud(false);
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
                      <TableHead className="font-semibold">Fraud Risk</TableHead>
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
                          {doc.fraud_risk ? (
                            <Badge className={fraudDetectionService.getRiskLevelColor(doc.fraud_risk)}>
                              <div className="flex items-center gap-1">
                                {doc.fraud_risk === 'HIGH' && <AlertTriangle className="h-3 w-3" />}
                                {doc.fraud_risk === 'MEDIUM' && <Clock className="h-3 w-3" />}
                                {doc.fraud_risk === 'LOW' && <CheckCircle className="h-3 w-3" />}
                                {doc.fraud_risk}
                              </div>
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not analyzed</span>
                          )}
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
                              onClick={() => deleteDocument(doc.id)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
                              title="Delete Document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => analyzeFraud(doc)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              title="Analyze for Fraud"
                              disabled={isAnalyzingFraud}
                            >
                              <Shield className="h-4 w-4" />
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


        {/* Fraud Analysis Modal */}
        {fraudAnalysis && (
          <FraudAnalysisModal
            isOpen={showFraudAnalysis}
            onClose={() => setShowFraudAnalysis(false)}
            fraudAnalysis={fraudAnalysis}
            onReportFraud={() => {
              // Handle fraud reporting
              toast({
                title: "Fraud Report",
                description: "Fraud reporting functionality will be implemented."
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
