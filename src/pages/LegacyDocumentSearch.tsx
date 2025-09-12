import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  Award,
  GraduationCap,
  Calendar,
  User,
  Hash,
  Building
} from "lucide-react";

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

export default function LegacyDocumentSearch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uin, setUin] = useState("");
  const [document, setDocument] = useState<LegacyDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uin.trim()) {
      toast({
        variant: "destructive",
        title: "Missing UIN",
        description: "Please enter a UIN to search for the document."
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`${API_BASE_URL}/legacy/search?uin=${encodeURIComponent(uin)}`);
      const data = await res.json();

      if (res.ok) {
        setDocument(data.document);
      } else {
        setDocument(null);
        toast({
          variant: "destructive",
          title: "Document Not Found",
          description: data.error || "No legacy document found with this UIN."
        });
      }
    } catch (error) {
      console.error('Error searching document:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for the document. Please try again."
      });
      setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    if (!document) return;

    try {
      const res = await fetch(`${API_BASE_URL}/legacy/download/${document.id}`);
      if (!res.ok) {
        const errorData = await res.json();
        toast({
          variant: "destructive",
          title: "Download Error",
          description: errorData.error || "Failed to download the document."
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `legacy_${document.student_name.replace(/\s+/g, '_')}_${document.doc_type}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "Failed to download the document. Please try again."
      });
    }
  };

  const viewDocument = () => {
    if (!document) return;
    window.open(`${API_BASE_URL}/legacy/view/${document.id}`, "_blank");
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
        return <Award className="h-5 w-5" />;
      case 'marksheet':
        return <GraduationCap className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/legacy-request')}
            className="border-border/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Request
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Legacy Document Search</h1>
            <p className="text-muted-foreground">Search for legacy documents using UIN</p>
          </div>
        </div>

        {/* Search Form */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Search Document
            </CardTitle>
            <CardDescription>
              Enter the UIN (Unique Identification Number) to search for a legacy document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uin">UIN (Unique Identification Number) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="uin"
                    placeholder="Enter UIN to search"
                    value={uin}
                    onChange={(e) => setUin(e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searched && (
          <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {document ? "Document found" : "No document found with this UIN"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document ? (
                <div className="space-y-6">
                  {/* Document Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDocTypeIcon(document.doc_type)}
                      <div>
                        <h3 className="text-lg font-semibold capitalize">{document.doc_type}</h3>
                        <p className="text-sm text-muted-foreground">Legacy Document</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(document.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(document.status)}
                        {document.status}
                      </div>
                    </Badge>
                  </div>

                  {/* Document Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Student Name</p>
                          <p className="font-medium">{document.student_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Roll Number</p>
                          <p className="font-medium">{document.student_roll}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">UIN</p>
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {document.uin}
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Date Issued</p>
                          <p className="font-medium">
                            {new Date(document.date_issued).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Issuing Institute</p>
                          <p className="font-medium">{document.institute_name}</p>
                        </div>
                      </div>
                      {document.marks && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Marks</p>
                            <p className="font-medium">{document.marks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Certificate ID (if verified) */}
                  {document.status === 'verified' && document.cert_id && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Verified Document</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Certificate ID</p>
                        <code className="text-sm font-mono text-green-400">
                          {document.cert_id}
                        </code>
                      </div>
                      {document.verified_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Verified on {new Date(document.verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={viewDocument}
                      variant="outline"
                      className="border-border/50 hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                    <Button
                      onClick={downloadDocument}
                      disabled={document.status !== 'verified'}
                      className={`${
                        document.status === 'verified' 
                          ? 'bg-gradient-primary hover:shadow-glow transition-all duration-300' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
                    </Button>
                  </div>

                  {document.status !== 'verified' && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">
                          Document is not yet verified
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        This document is currently {document.status}. Please check back later or contact the issuing institute.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Document Found</h3>
                  <p className="text-muted-foreground">
                    No legacy document found with UIN: <code className="bg-muted px-2 py-1 rounded">{uin}</code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
