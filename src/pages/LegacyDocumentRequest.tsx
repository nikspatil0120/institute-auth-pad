import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, ArrowLeft, GraduationCap, Award, FileSpreadsheet, Scan, Shield } from "lucide-react";
import OCRProcessor from "@/components/OCRProcessor";
import FraudDetectionAlert from "@/components/FraudDetectionAlert";
import FraudAnalysisModal from "@/components/FraudAnalysisModal";
import { ParsedData } from "@/services/ocrService";
import fraudDetectionService, { FraudAnalysis } from "@/services/fraudDetectionService";

interface Institute {
  id: number;
  name: string;
}


const API_BASE_URL = "http://localhost:5000/api";

export default function LegacyDocumentRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(null);
  const [showFraudAnalysis, setShowFraudAnalysis] = useState(false);
  const [isAnalyzingFraud, setIsAnalyzingFraud] = useState(false);
  const [uinValidation, setUinValidation] = useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({ isValid: true, message: '', isChecking: false });

  const [formData, setFormData] = useState({
    studentName: "",
    studentRoll: "",
    docType: "",
    marks: "",
    uin: "",
    dateIssued: "",
    instituteId: "",
    document: null as File | null
  });

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/legacy/institutes`);
      const data = await res.json();
      if (res.ok) {
        setInstitutes(data.institutes || []);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
    }
  };

  const checkUINExists = async (uin: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/legacy/check-uin/${uin}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data?.exists);
    } catch (error) {
      console.error('Error checking UIN:', error);
      return false;
    }
  };

  // Debounced UIN uniqueness validation
  useEffect(() => {
    let timer: number | undefined;
    const uin = formData.uin?.trim();
    if (!uin) {
      setUinValidation({ isValid: true, message: '', isChecking: false });
      return;
    }
    setUinValidation(prev => ({ ...prev, isChecking: true }));
    // debounce 400ms
    // @ts-ignore - window.setTimeout typing vs Node
    timer = setTimeout(async () => {
      const exists = await checkUINExists(uin);
      if (exists) {
        setUinValidation({
          isValid: false,
          message: `A document with UIN ${uin} already exists. Each UIN can only have one document.`,
          isChecking: false,
        });
      } else {
        setUinValidation({ isValid: true, message: '', isChecking: false });
      }
    }, 400);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formData.uin]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, document: file }));
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
    const validFile = files.find(file => 
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    if (validFile) {
      handleFileChange(validFile);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a valid PDF or image file."
      });
    }
  };

  const handleOCRDataExtracted = (data: ParsedData) => {
    setFormData(prev => ({
      ...prev,
      studentName: data.studentName || prev.studentName,
      studentRoll: data.studentRoll || prev.studentRoll,
      uin: data.certificateNumber || data.uin || prev.uin,
      marks: data.marks || prev.marks,
      dateIssued: data.dateIssued || prev.dateIssued,
      docType: data.courseName || prev.docType
    }));
    
    setShowOCR(false);
    
    toast({
      title: "Data Extracted",
      description: "OCR data has been filled into the form. Please verify and complete any missing fields.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.studentName || !formData.studentRoll || !formData.docType || 
          !formData.uin || !formData.dateIssued || !formData.instituteId || !formData.document) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields and upload a document."
        });
        return;
      }

      // Validate marks for marksheets
      if (formData.docType === 'marksheet' && !formData.marks) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Marks are required for marksheets."
        });
        return;
      }

      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('student_name', formData.studentName);
      submitData.append('student_roll', formData.studentRoll);
      submitData.append('doc_type', formData.docType);
      submitData.append('uin', formData.uin);
      submitData.append('date_issued', formData.dateIssued);
      submitData.append('institute_id', formData.instituteId);
      if (formData.marks) {
        submitData.append('marks', formData.marks);
      }
      submitData.append('document', formData.document!);

      const res = await fetch(`${API_BASE_URL}/legacy/request`, {
        method: 'POST',
        body: submitData
      });

      const data = await res.json();

      if (res.ok) {
        // Perform fraud detection on the uploaded document (only for image files)
        try {
          setIsAnalyzingFraud(true);
          
          // Fraud detection now works on both PDF and image files
          if (formData.document) {
            const extractedData: ParsedData = {
              studentName: formData.studentName,
              studentRoll: formData.studentRoll,
              certificateNumber: formData.uin,
              institutionName: institutes.find(inst => inst.id.toString() === formData.instituteId)?.name || '',
              courseName: formData.docType,
              marks: formData.marks,
              dateIssued: formData.dateIssued,
              uin: formData.uin
            };

            const fraudResult = await fraudDetectionService.detectFraud(formData.document!, extractedData);
            setFraudAnalysis(fraudResult);

            // Save fraud analysis to database
            try {
              await fetch(`${API_BASE_URL}/legacy/requests/${data.request_id}/fraud-analysis`, {
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

            // Show appropriate toast based on risk level
            if (fraudResult.risk_level === 'HIGH') {
              toast({
                variant: "destructive",
                title: "High Fraud Risk Detected",
                description: `Document shows HIGH fraud risk. Please review the analysis carefully.`
              });
            } else if (fraudResult.risk_level === 'MEDIUM') {
              toast({
                variant: "destructive",
                title: "Medium Fraud Risk Detected",
                description: `Document shows MEDIUM fraud risk. Please review the analysis.`
              });
            } else {
              toast({
                title: "Request Submitted Successfully",
                description: `Document shows LOW fraud risk. Your legacy document verification request has been submitted.`
              });
            }
          }
        } catch (fraudError) {
          console.error('Fraud detection failed:', fraudError);
          toast({
            title: "Request Submitted",
            description: "Your legacy document verification request has been submitted successfully. (Fraud analysis unavailable)"
          });
        } finally {
          setIsAnalyzingFraud(false);
        }
        
        // Reset form
        setFormData({
          studentName: "",
          studentRoll: "",
          docType: "",
          marks: "",
          uin: "",
          dateIssued: "",
          instituteId: "",
          document: null
        });
        // Don't clear fraud analysis - let user see the results
      } else {
        // Handle specific error cases
        if (res.status === 409) {
          // UIN already exists
          const existingDoc = data.existing_document;
          toast({
            variant: "destructive",
            title: "UIN Already Exists",
            description: `A document with UIN ${formData.uin} already exists for student ${existingDoc?.student_name || 'Unknown'}. Each UIN can only have one document.`
          });
        } else {
          throw new Error(data.error || 'Failed to submit request');
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit request"
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-border/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Legacy Document Digitization</h1>
              <p className="text-muted-foreground">Submit your old documents for digital verification</p>
            </div>
          </div>
          
          {/* Search Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/legacy-search')}
            className="border-border/50 hover:bg-primary/10"
          >
            <FileText className="h-4 w-4 mr-2" />
            Search Documents
          </Button>
        </div>

        {/* Form */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Document Information
            </CardTitle>
            <CardDescription>
              Fill in the details of your legacy document for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input
                    id="studentName"
                    placeholder="Enter your full name"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange('studentName', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentRoll">Roll Number *</Label>
                  <Input
                    id="studentRoll"
                    placeholder="Enter your roll number"
                    value={formData.studentRoll}
                    onChange={(e) => handleInputChange('studentRoll', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              {/* Document Type and Marks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docType">Document Type *</Label>
                  <Select value={formData.docType} onValueChange={(value) => handleInputChange('docType', value)}>
                    <SelectTrigger className="bg-input border-border/50 focus:border-primary/50">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Certificate
                        </div>
                      </SelectItem>
                      <SelectItem value="marksheet">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Marksheet
                        </div>
                      </SelectItem>
                      <SelectItem value="document">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Other Document
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.docType === 'marksheet' && (
                  <div className="space-y-2">
                    <Label htmlFor="marks">Marks *</Label>
                    <Input
                      id="marks"
                      type="number"
                      placeholder="Enter total marks"
                      value={formData.marks}
                      onChange={(e) => handleInputChange('marks', e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50"
                      required={formData.docType === 'marksheet'}
                    />
                  </div>
                )}
              </div>

              {/* UIN and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uin">UIN (Unique Identification Number) *</Label>
                  <Input
                    id="uin"
                    placeholder="Enter UIN"
                    value={formData.uin}
                    onChange={(e) => handleInputChange('uin', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                    required
                  />
                  {!uinValidation.isValid && (
                    <p className="text-sm text-destructive">{uinValidation.message}</p>
                  )}
                  {uinValidation.isChecking && (
                    <p className="text-sm text-muted-foreground">Checking UIN availability...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateIssued">Date Issued *</Label>
                  <Input
                    id="dateIssued"
                    type="date"
                    value={formData.dateIssued}
                    onChange={(e) => handleInputChange('dateIssued', e.target.value)}
                    className="bg-input border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              {/* Institute Selection */}
              <div className="space-y-2">
                <Label htmlFor="instituteId">Issuing Institute *</Label>
                <Select value={formData.instituteId} onValueChange={(value) => handleInputChange('instituteId', value)}>
                  <SelectTrigger className="bg-input border-border/50 focus:border-primary/50">
                    <SelectValue placeholder="Select the institute that issued this document" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutes.map((institute) => (
                      <SelectItem key={institute.id} value={institute.id.toString()}>
                        {institute.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Document Upload *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOCR(true)}
                    className="border-primary/50 hover:bg-primary/10"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Extract with OCR
                  </Button>
                </div>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  {formData.document ? (
                    <div>
                      <p className="text-lg font-medium mb-2">{formData.document.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleFileChange(null)}
                        className="border-border/50"
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">Drop PDF or image file here</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse files
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="document-upload"
                      />
                      <Button asChild variant="outline" className="border-primary/50 hover:bg-primary/10">
                        <label htmlFor="document-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || isAnalyzingFraud || !uinValidation.isValid || uinValidation.isChecking}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {isAnalyzingFraud ? (
                  <>
                    <Shield className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing for Fraud...
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Legacy Document Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Fraud Detection Alert */}
        {fraudAnalysis && (
          <div className="max-w-4xl mx-auto">
            <FraudDetectionAlert
              fraudAnalysis={fraudAnalysis}
              onViewDetails={() => setShowFraudAnalysis(true)}
              onReportFraud={() => {
                // Handle fraud reporting
                toast({
                  title: "Fraud Report",
                  description: "Fraud reporting functionality will be implemented."
                });
              }}
              onClearAnalysis={() => setFraudAnalysis(null)}
            />
          </div>
        )}

        {/* OCR Modal */}
        {showOCR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">OCR Text Extraction</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowOCR(false)}
                  >
                    Close
                  </Button>
                </div>
                <OCRProcessor
                  onDataExtracted={handleOCRDataExtracted}
                  showFormFields={true}
                />
              </div>
            </div>
          </div>
        )}

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