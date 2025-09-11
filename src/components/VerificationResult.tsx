import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield, Calendar, User, GraduationCap, Award, ArrowLeft, Download, ExternalLink } from "lucide-react";

interface VerificationData {
  method: string;
  input: string;
  timestamp: string;
}

// Mock verification result based on input
const generateVerificationResult = (data: VerificationData) => {
  const isValid = Math.random() > 0.2; // 80% success rate for demo
  
  if (isValid) {
    return {
      status: "valid" as const,
      certificate: {
        id: data.method === "Certificate ID" ? data.input : "CS001-2024-A7X9K2",
        studentName: "John Doe",
        rollNo: "CS001",
        course: "Computer Science",
        institution: "Tech University",
        issueDate: "March 15, 2024",
        blockchainHash: "0x4f2a6b8c9d3e5f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
        marks: 85,
        grade: "A"
      },
      verificationDetails: {
        verifiedAt: new Date().toISOString(),
        method: data.method,
        blockchainNetwork: "Ethereum Mainnet",
        transactionId: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6",
        confirmations: 247
      }
    };
  } else {
    return {
      status: "invalid" as const,
      error: {
        code: "CERT_NOT_FOUND",
        message: "Certificate not found in our verification database",
        possibleReasons: [
          "Certificate ID may be incorrect",
          "Certificate may not be issued by a verified institution",
          "Certificate may be revoked or expired"
        ]
      }
    };
  }
};

export default function VerificationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as VerificationData;
  
  if (!data) {
    navigate("/verify");
    return null;
  }

  const result = generateVerificationResult(data);

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

            {/* Certificate Details */}
            {result.status === "valid" ? (
              <div className="space-y-6 pt-8 border-t border-border/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Certificate ID
                    </label>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <code className="text-lg font-mono font-bold text-primary break-all">
                        {result.certificate.id}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Blockchain Hash
                    </label>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <code className="text-sm font-mono text-muted-foreground break-all">
                        {result.certificate.blockchainHash.substring(0, 16)}...
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

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Student Name
                    </label>
                    <p className="text-xl font-semibold text-foreground">{result.certificate.studentName}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Course
                    </label>
                    <p className="text-xl font-semibold text-foreground">{result.certificate.course}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-8 border-t border-border/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Certificate ID
                  </label>
                  <div className="p-4 rounded-lg bg-muted/20 border border-red-500/30">
                    <code className="text-lg font-mono font-bold text-red-400 break-all">
                      {data.method === "Certificate ID" ? data.input : "Not Found"}
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
                  <p className="text-red-400 font-medium">Error: {result.error.message}</p>
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