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
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/verify")}
            className="border-border/50 hover:bg-muted/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Verification
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Verification Result</h1>
            <p className="text-muted-foreground">Certificate verification completed</p>
          </div>
        </div>

        {/* Result Status */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              {result.status === "valid" ? (
                <div className="p-4 rounded-full bg-green-500/20 border-2 border-green-500/30">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>
              ) : (
                <div className="p-4 rounded-full bg-red-500/20 border-2 border-red-500/30">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {result.status === "valid" ? "Certificate Verified ✓" : "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-base">
              {result.status === "valid" 
                ? "This certificate is authentic and valid"
                : "Unable to verify this certificate"
              }
            </CardDescription>
          </CardHeader>
        </Card>

        {result.status === "valid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Certificate Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card/95 backdrop-blur-sm border-green-500/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-400" />
                    Certificate Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Student Name</label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{result.certificate.studentName}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Roll Number</label>
                      <span className="font-mono text-primary font-medium">{result.certificate.rollNo}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Course</label>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{result.certificate.course}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Institution</label>
                      <span className="font-medium text-foreground">{result.certificate.institution}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{result.certificate.issueDate}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Grade</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold">
                        {result.certificate.marks}% - Grade {result.certificate.grade}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/30">
                    <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <code className="text-sm font-mono text-primary break-all">
                        {result.certificate.id}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Blockchain Hash</label>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <code className="text-xs font-mono text-muted-foreground break-all">
                        {result.certificate.blockchainHash}
                      </code>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button variant="outline" className="border-border/50 hover:bg-muted/20">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Blockchain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Verification Details */}
            <div className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-sm border-blue-500/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    Verification Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Method</label>
                      <p className="font-medium text-foreground">{result.verificationDetails.method}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Network</label>
                      <p className="font-medium text-foreground">{result.verificationDetails.blockchainNetwork}</p>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Confirmations</label>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {result.verificationDetails.confirmations}
                      </Badge>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Verified At</label>
                      <p className="text-sm font-mono text-foreground">
                        {new Date(result.verificationDetails.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-400">98%</div>
                    <div className="text-sm text-muted-foreground">Highly Trusted</div>
                    <div className="w-full bg-muted/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: "98%"}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Error State
          <Card className="bg-card/95 backdrop-blur-sm border-red-500/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <XCircle className="h-5 w-5" />
                Verification Failed
              </CardTitle>
              <CardDescription>
                Error Code: {result.error.code}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">{result.error.message}</p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Possible reasons:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.error.possibleReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => navigate("/verify")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Try Again
                </Button>
                <Button variant="outline" className="border-border/50 hover:bg-muted/20">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}