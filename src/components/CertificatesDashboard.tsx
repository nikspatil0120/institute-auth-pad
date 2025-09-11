import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Award, Calendar, Hash, User, GraduationCap, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: string;
  studentName: string;
  rollNo: string;
  course: string;
  certificateId: string;
  blockchainHash: string;
  issueDate: Date;
  status: 'confirmed' | 'pending' | 'issued';
  marks: number;
}

// Sample certificate data
const certificates: Certificate[] = [
  {
    id: "1",
    studentName: "John Doe",
    rollNo: "CS001",
    course: "Computer Science",
    certificateId: "CS001-2024-A7X9K2",
    blockchainHash: "0x4f2a6b8c9d3e5f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
    issueDate: new Date("2024-03-15"),
    status: 'confirmed',
    marks: 85
  },
  {
    id: "2", 
    studentName: "Jane Smith",
    rollNo: "EE002",
    course: "Electrical Engineering",
    certificateId: "EE002-2023-B8Y2L3",
    blockchainHash: "0x7a3d8e2f1b4c5a6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
    issueDate: new Date("2024-02-28"),
    status: 'issued',
    marks: 92
  },
  {
    id: "3",
    studentName: "Mike Johnson", 
    rollNo: "ME003",
    course: "Mechanical Engineering",
    certificateId: "ME003-2024-C9Z3M4",
    blockchainHash: "0x2b5c8f3a6d9e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b",
    issueDate: new Date("2024-03-10"),
    status: 'confirmed',
    marks: 78
  },
  {
    id: "4",
    studentName: "Sarah Wilson",
    rollNo: "CS004", 
    course: "Computer Science",
    certificateId: "CS004-2024-D0A4N5",
    blockchainHash: "0x9e6f2b5c8a1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a",
    issueDate: new Date("2024-03-20"),
    status: 'pending',
    marks: 96
  },
  {
    id: "5",
    studentName: "Alex Chen",
    rollNo: "CS005",
    course: "Computer Science", 
    certificateId: "CS005-2024-E1B5O6",
    blockchainHash: "0x1c4d7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f",
    issueDate: new Date("2024-01-25"),
    status: 'issued',
    marks: 88
  },
  {
    id: "6",
    studentName: "Emma Davis",
    rollNo: "EE006",
    course: "Electrical Engineering",
    certificateId: "EE006-2024-F2C6P7", 
    blockchainHash: "0x8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1e4f",
    issueDate: new Date("2024-02-14"),
    status: 'confirmed',
    marks: 91
  },
  {
    id: "7",
    studentName: "David Lee",
    rollNo: "ME007",
    course: "Mechanical Engineering",
    certificateId: "ME007-2024-G3D7Q8",
    blockchainHash: "0x5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b",
    issueDate: new Date("2024-03-05"),
    status: 'issued',
    marks: 82
  },
  {
    id: "8",
    studentName: "Lisa Wang",
    rollNo: "CS008",
    course: "Computer Science",
    certificateId: "CS008-2024-H4E8R9",
    blockchainHash: "0x2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c",
    issueDate: new Date("2024-03-18"),
    status: 'confirmed',
    marks: 94
  }
];

export default function CertificatesDashboard() {
  const { toast } = useToast();

  const handleDownloadPDF = (certificate: Certificate) => {
    toast({
      title: "PDF Download Started",
      description: `Downloading certificate for ${certificate.studentName}...`
    });
    
    // Simulate PDF download
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `Certificate ${certificate.certificateId}.pdf downloaded successfully.`
      });
    }, 1500);
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

  const getMarksColor = (marks: number) => {
    if (marks >= 90) return 'text-green-400';
    if (marks >= 75) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Award className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Issued Certificates</h1>
            <p className="text-muted-foreground">
              Manage and download blockchain-verified digital certificates ({certificates.length} total)
            </p>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <FileText className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Issued</p>
                  <p className="text-xl font-bold text-foreground">{certificates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <GraduationCap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-xl font-bold text-foreground">{new Set(certificates.map(c => c.studentName)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-xl font-bold text-foreground">
                    {certificates.filter(c => c.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Calendar className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold text-foreground">
                    {certificates.filter(c => 
                      c.issueDate.getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <Card 
              key={certificate.id}
              className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {certificate.studentName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{certificate.rollNo}</p>
                    </div>
                  </div>
                  <Badge 
                    className={`${getStatusColor(certificate.status)} font-medium`}
                    variant="outline"
                  >
                    {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Course</span>
                    <span className="text-sm font-medium text-foreground">{certificate.course}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Marks</span>
                    <span className={`text-sm font-bold ${getMarksColor(certificate.marks)}`}>
                      {certificate.marks}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Certificate ID</span>
                    <div className="p-2 rounded bg-muted/20 border border-border/30">
                      <code className="text-xs font-mono text-primary break-all">
                        {certificate.certificateId}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Blockchain Hash</span>
                    <div className="p-2 rounded bg-muted/20 border border-border/30">
                      <code className="text-xs font-mono text-muted-foreground break-all">
                        {certificate.blockchainHash.substring(0, 24)}...
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Issue Date</span>
                    <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(certificate.issueDate)}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  onClick={() => handleDownloadPDF(certificate)}
                  className="w-full bg-green-600 hover:bg-green-700 hover:shadow-glow text-white transition-all duration-300 group-hover:scale-105"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State (if no certificates) */}
        {certificates.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Certificates Found</h3>
            <p className="text-muted-foreground">
              Certificates will appear here once they are issued.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}