import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  Loader2, 
  Scan,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OCRService, ExtractedData, ParsedData } from '@/services/ocrService';

interface OCRProcessorProps {
  onDataExtracted?: (data: ParsedData) => void;
  onExtract?: (data: ExtractedData) => void;
  showFormFields?: boolean;
  className?: string;
}

const OCRProcessor: React.FC<OCRProcessorProps> = ({
  onDataExtracted,
  onExtract,
  showFormFields = true,
  className = ""
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select a file smaller than 10MB."
        });
        return;
      }

      // Check file type
      const validTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/tiff'
      ];

      if (validTypes.includes(selectedFile.type.toLowerCase())) {
        setFile(selectedFile);
        toast({
          title: "File Selected",
          description: `${selectedFile.name} is ready for OCR processing.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select a valid image file (JPG, PNG, GIF, BMP, WEBP, or TIFF)."
        });
      }
    }
  };

  const processDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const result = await OCRService.extractText(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Call callbacks
      if (onDataExtracted) {
        onDataExtracted(result.parsedData);
      }
      if (onExtract) {
        onExtract(result);
      }

      toast({
        title: "Text Extraction Complete",
        description: `Extracted text with ${result.confidence}% confidence`,
      });
    } catch (error) {
      console.error('OCR processing failed:', error);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "Failed to extract text from the document. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessor = () => {
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-primary" />
          OCR Document Processing
        </CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>📸 <strong>For best OCR results:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use clear, high-resolution images (at least 300 DPI)</li>
            <li>Ensure good lighting and contrast</li>
            <li>Keep text straight and avoid angles</li>
            <li>Minimize shadows and reflections</li>
            <li>PDF files are not supported in client-side OCR</li>
          </ul>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,image/tiff"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mb-4"
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Document
            </Button>
            {file && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected: {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="space-y-4">
              <Button
                onClick={processDocument}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing... {progress}%
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Extract Text
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetProcessor}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRProcessor;