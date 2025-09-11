import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield, Calendar, User, GraduationCap, Award, ArrowLeft, Download, ExternalLink, FileText, Hash } from "lucide-react";

interface VerificationData {
  method: string;
  input: string;
  timestamp: string;
  result: any;
}

interface Document {
  id: number;
  doc_type: string;
  name: string;
  number?: string;
  exam_name?: string;
  issue_date: string;
  blockchain_hash: string;
  status: string;
  created_at: string;
}

interface VerificationResult {
  status: "valid" | "invalid";
  document?: Document;
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

export default function VerificationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as VerificationData;
  
  if (!data) {
    navigate("/verify");
    return null;
  }

  const result: VerificationResult = data.result;

  return (
    <div className="min-h-screen bg-gradient-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        {/* Main Result Card */}
        <Card className={`bg-card/95 backdrop-blur-sm shadow-card text-center transition-all duration-500 ${
          result.status === "valid" 
            ? "border-green-500/50 shadow-green-500/20 shadow-2xl" 
            : "border-red-500/50 shadow-red-500/20 shadow-2xl"
        }`}>
          <CardContent className="p-12 space-y-8">
            {/* Status Icon & Message */}
            <div className="space-y-6">
              {result.status === "valid" ? (
                <>
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative p-6 rounded-full bg-green-500/20 border-2 border-green-500/50">
                        <CheckCircle2 className="h-24 w-24 text-green-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-green-400">Certificate Verified Successfully</h1>
                    <p className="text-lg text-muted-foreground">This certificate is authentic and valid</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative p-6 rounded-full bg-red-500/20 border-2 border-red-500/50">
                        <XCircle className="h-24 w-24 text-red-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-red-400">Certificate Not Found / Invalid</h1>
                    <p className="text-lg text-muted-foreground">Unable to verify this certificate</p>
                  </div>
                </>
              )}
            </div>

            {/* Document Details */}
            {result.status === "valid" && result.document ? (
              <div className="space-y-6 pt-8 border-t border-border/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Document ID
                    </label>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <code className="text-lg font-mono font-bold text-primary break-all">
                        {result.document.id}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Blockchain Hash
                    </label>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <code className="text-sm font-mono text-muted-foreground break-all">
                        {result.document.blockchain_hash.substring(0, 16)}...
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </label>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold text-lg px-4 py-2">
                        ✅ VERIFIED
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Document Type and Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Document Type
                    </label>
                    <div className="flex items-center gap-2">
                      {result.document.doc_type === "certificate" && <Award className="h-5 w-5 text-primary" />}
                      {result.document.doc_type === "marksheet" && <GraduationCap className="h-5 w-5 text-primary" />}
                      {result.document.doc_type === "document" && <FileText className="h-5 w-5 text-primary" />}
                      <p className="text-xl font-semibold text-foreground capitalize">{result.document.doc_type}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Document Name
                    </label>
                    <p className="text-xl font-semibold text-foreground">{result.document.name}</p>
                  </div>
                </div>

                {/* Additional Details based on document type */}
                {(result.document.number || result.document.exam_name) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {result.document.number && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Document Number
                        </label>
                        <p className="text-lg font-semibold text-foreground">{result.document.number}</p>
                      </div>
                    )}
                    
                    {result.document.exam_name && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Exam Name
                        </label>
                        <p className="text-lg font-semibold text-foreground">{result.document.exam_name}</p>
                      </div>
                    )}
                    
                  </div>
                )}

                {/* Issue Date */}
                <div className="pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Issue Date
                    </label>
                  </div>
                  <p className="text-lg font-semibold text-foreground mt-2">
                    {new Date(result.document.issue_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-8 border-t border-border/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Document ID
                  </label>
                  <div className="p-4 rounded-lg bg-muted/20 border border-red-500/30">
                    <code className="text-lg font-mono font-bold text-red-400 break-all">
                      {data.method === "Document ID" ? data.input : "Not Found"}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </label>
                  <div className="p-4 rounded-lg bg-muted/20 border border-red-500/30">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-bold text-lg px-4 py-2">
                      ❌ INVALID
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 font-medium">Error: {result.error?.message}</p>
                  {result.error?.code && (
                    <p className="text-sm text-red-300 mt-1">Error Code: {result.error.code}</p>
                  )}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-8">
              <Button
                onClick={() => navigate("/verify")}
                variant="outline"
                size="lg"
                className="border-primary/50 hover:bg-primary/10 hover:border-primary text-primary font-semibold px-8 py-3 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Verify
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Verification powered by blockchain technology
          </p>
        </div>
      </div>
    </div>
  );
}