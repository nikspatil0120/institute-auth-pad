import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Shield, Calendar, User, GraduationCap, Award, ArrowLeft, Download, ExternalLink, FileText, Hash } from "lucide-react";
import { buildInstituteUrl } from "@/lib/institute-utils";

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
  student_roll?: string;
  student_name?: string;
  institute_name?: string;
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

type Props = { backPath?: string };

export default function VerificationResult({ backPath = "/verify" }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { instituteName } = useParams<{ instituteName: string }>();
  const data = location.state as VerificationData;
  
  // Determine the correct back path based on context
  const getBackPath = () => {
    if (backPath !== "/verify") {
      return backPath; // Use provided path (e.g., for public verification)
    }
    if (instituteName) {
      return buildInstituteUrl("/verify", instituteName);
    }
    return backPath; // Fallback to default
  };
  
  if (!data) {
    navigate(getBackPath());
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
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-muted-foreground font-medium">Certificate ID</TableCell>
                      <TableCell>
                        <code className="font-mono text-primary">{(result.document as any).cert_id || '—'}</code>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground font-medium">UIN</TableCell>
                      <TableCell>
                        <code className="font-mono">{(result.document as any).uin || (result.document.doc_type !== 'certificate' ? result.document.number : '—')}</code>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="text-muted-foreground font-medium">Document Name</TableCell>
                      <TableCell>{result.document.name}</TableCell>
                    </TableRow>
                    {result.document.institute_name && (
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Issued By</TableCell>
                        <TableCell className="font-medium text-primary">{result.document.institute_name}</TableCell>
                      </TableRow>
                    )}
                    {result.document.student_name && (
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Student Name</TableCell>
                        <TableCell>{result.document.student_name}</TableCell>
                      </TableRow>
                    )}
                    {result.document.student_roll && (
                      <TableRow>
                        <TableCell className="text-muted-foreground font-medium">Roll No</TableCell>
                        <TableCell>{result.document.student_roll}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="text-muted-foreground font-medium">Issue Date</TableCell>
                      <TableCell>{new Date(result.document.issue_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
                onClick={() => navigate(getBackPath())}
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