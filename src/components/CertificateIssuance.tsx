import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Hash, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  course: string;
  year: string;
  marks: number;
}

interface Certificate {
  id: string;
  studentId: string;
  certificateId: string;
  blockchainHash: string;
  status: 'pending' | 'confirmed' | 'issued';
  qrCode: string;
  issuedAt: Date;
}

// Sample student data
const students: Student[] = [
  {
    id: "1",
    rollNo: "CS001",
    name: "John Doe",
    course: "Computer Science",
    year: "2024",
    marks: 85
  },
  {
    id: "2",
    rollNo: "EE002", 
    name: "Jane Smith",
    course: "Electrical Engineering",
    year: "2023",
    marks: 92
  },
  {
    id: "3",
    rollNo: "ME003",
    name: "Mike Johnson", 
    course: "Mechanical Engineering",
    year: "2024",
    marks: 78
  },
  {
    id: "4",
    rollNo: "CS004",
    name: "Sarah Wilson",
    course: "Computer Science", 
    year: "2024",
    marks: 96
  }
];

export default function CertificateIssuance() {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const generateRandomString = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateBlockchainHash = (): string => {
    return "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
  };

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: 200,
        margin: 2,
        color: {
          dark: "#8B5CF6",
          light: "#1A1B23"
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error("QR Code generation failed:", error);
      return "";
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedStudent) {
      toast({
        variant: "destructive",
        title: "No Student Selected",
        description: "Please select a student to generate certificate."
      });
      return;
    }

    setIsGenerating(true);

    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;

    // Generate certificate ID in format <ROLL>-<YEAR>-<RANDOM>
    const randomPart = generateRandomString(6);
    const certificateId = `${student.rollNo}-${student.year}-${randomPart}`;
    const blockchainHash = generateBlockchainHash();
    
    // Create verification URL for QR code
    const verificationUrl = `https://verify.institute.edu/cert/${certificateId}`;
    const qrCode = await generateQRCode(verificationUrl);

    // Simulate processing time
    setTimeout(() => {
      const newCertificate: Certificate = {
        id: Date.now().toString(),
        studentId: selectedStudent,
        certificateId,
        blockchainHash,
        status: Math.random() > 0.3 ? 'confirmed' : 'pending',
        qrCode: verificationUrl,
        issuedAt: new Date()
      };

      setCertificate(newCertificate);
      setQrCodeDataUrl(qrCode);
      setIsGenerating(false);

      toast({
        title: "Certificate Generated",
        description: `Certificate ${certificateId} has been created successfully.`
      });
    }, 2000);
  };

  const handleDownloadPDF = () => {
    if (!certificate) return;
    
    toast({
      title: "PDF Download",
      description: "Certificate PDF is being prepared for download..."
    });
    
    // Simulate PDF download
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `certificate_${certificate.certificateId}.pdf`;
      link.click();
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';  
      case 'issued':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Certificate Issuance</h1>
            <p className="text-muted-foreground">Generate blockchain-verified digital certificates</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Generation */}
          <div className="xl:col-span-2 space-y-6">
            {/* Student Selection */}
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generate Certificate
                </CardTitle>
                <CardDescription>
                  Select a student and generate their blockchain certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Select Student</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="bg-input border-border/50 focus:border-primary/50">
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/50">
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-muted-foreground ml-4">
                              {student.rollNo} - {student.course}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStudentData && (
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <h4 className="font-semibold text-foreground mb-2">Student Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Roll Number:</span>
                        <span className="ml-2 font-medium text-primary">{selectedStudentData.rollNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <span className="ml-2 font-medium">{selectedStudentData.year}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Course:</span>
                        <span className="ml-2 font-medium">{selectedStudentData.course}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Marks:</span>
                        <span className="ml-2 font-medium text-green-400">{selectedStudentData.marks}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerateCertificate}
                  disabled={!selectedStudent || isGenerating}
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Certificate...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Generate Certificate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Certificate Results */}
            {certificate && (
              <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    Certificate Generated
                  </CardTitle>
                  <CardDescription>
                    Your certificate has been created and recorded on the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                        <span className="font-mono text-sm font-medium text-primary">
                          {certificate.certificateId}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Blockchain Hash</label>
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                        <span className="font-mono text-xs text-muted-foreground break-all">
                          {certificate.blockchainHash.substring(0, 20)}...
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                        <Badge 
                          className={`${getStatusColor(certificate.status)} font-medium`}
                          variant="outline"
                        >
                          {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-green-600 hover:bg-green-700 hover:shadow-glow text-white transition-all duration-300"
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    
                    <Button variant="outline" className="border-border/50 hover:bg-muted/20">
                      <Hash className="h-4 w-4 mr-2" />
                      View on Blockchain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - QR Code */}
          <div className="space-y-6">
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Verification QR
                </CardTitle>
                <CardDescription>
                  Scan to verify certificate authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qrCodeDataUrl ? (
                  <div className="space-y-4">
                    <div className="flex justify-center p-6 rounded-lg bg-white">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Certificate QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        QR Code for certificate verification
                      </p>
                      <p className="text-xs text-muted-foreground font-mono break-all px-2">
                        {certificate?.qrCode}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Generate a certificate to see the QR code
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificate Stats */}
            <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Issuance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="font-semibold text-primary">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-semibold text-primary">284</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Issued</span>
                  <span className="font-semibold text-primary">1,247</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}