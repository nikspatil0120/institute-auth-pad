import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Upload, FileText, Search, CheckCircle2, Lock, Verified } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function CertificateVerification() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState("certificate-id");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      toast({
        title: "PDF Uploaded",
        description: `File "${file.name}" uploaded successfully.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a valid PDF certificate."
      });
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
      setUploadedFile(pdfFile);
      toast({
        title: "PDF Uploaded",
        description: `File "${pdfFile.name}" uploaded successfully.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a valid PDF certificate."
      });
    }
  };

  const handleVerify = async () => {
    if (activeTab === "certificate-id" && !certificateId.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Certificate ID",
        description: "Please enter a certificate ID to verify."
      });
      return;
    }

    if (activeTab === "upload-pdf" && !uploadedFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please upload a certificate PDF to verify."
      });
      return;
    }

    setIsVerifying(true);

    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);
      
      // Pass verification data through navigation state
      const verificationData = {
        method: activeTab === "certificate-id" ? "Certificate ID" : "PDF Upload",
        input: activeTab === "certificate-id" ? certificateId : uploadedFile?.name,
        timestamp: new Date().toISOString()
      };

      navigate("/verify/result", { state: verificationData });
    }, 2500);
  };

  const canVerify = (activeTab === "certificate-id" && certificateId.trim()) || 
                   (activeTab === "upload-pdf" && uploadedFile);

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-green-500/20 border-2 border-green-500/30">
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Certificate Verification</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify the authenticity of digital certificates issued by educational institutions. 
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
              Verify Certificate
            </CardTitle>
            <CardDescription className="text-base">
              Choose your preferred verification method below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="certificate-id" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Certificate ID
                </TabsTrigger>
                <TabsTrigger value="upload-pdf" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="certificate-id" className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="certificate-id" className="text-base font-medium">
                    Enter Certificate ID
                  </Label>
                  <Input
                    id="certificate-id"
                    type="text"
                    placeholder="e.g., CS001-2024-A7X9K2"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="h-12 text-base bg-input border-border/50 focus:border-green-500/50 focus:ring-green-500/20"
                  />
                  <p className="text-sm text-muted-foreground">
                    The certificate ID can be found on your digital certificate document.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="upload-pdf" className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Upload Certificate PDF</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                      dragOver 
                        ? "border-green-500 bg-green-500/5" 
                        : uploadedFile
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-border hover:border-green-500/50 hover:bg-green-500/5"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {uploadedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <div className="p-3 rounded-full bg-green-500/20">
                            <FileText className="h-8 w-8 text-green-400" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setUploadedFile(null)}
                          className="mt-2 border-border/50 hover:bg-muted/20 text-sm"
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium mb-2">Drop your PDF certificate here</p>
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
                  <p className="text-sm text-muted-foreground">
                    Upload your original certificate PDF file for verification.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Verify Button */}
            <div className="pt-6 border-t border-border/30 mt-8">
              <Button
                onClick={handleVerify}
                disabled={!canVerify || isVerifying}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Verifying Certificate...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-3" />
                    Verify Certificate
                  </>
                )}
              </Button>
              
              {!canVerify && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {activeTab === "certificate-id" 
                    ? "Enter a certificate ID to continue" 
                    : "Upload a PDF file to continue"
                  }
                </p>
              )}
            </div>
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