import Tesseract from 'tesseract.js';

export interface ExtractedData {
  rawText: string;
  confidence: number;
  parsedData: ParsedData;
  processingTime: number;
}

export interface ParsedData {
  studentName?: string;
  studentRoll?: string;
  certificateNumber?: string;
  institutionName?: string;
  courseName?: string;
  marks?: string;
  dateIssued?: string;
  uin?: string;
}

export class OCRService {
  static async extractText(file: File): Promise<ExtractedData> {
    const startTime = Date.now();
    
    try {
      // Validate file type
      if (!this.isValidFileType(file)) {
        throw new Error('Unsupported file type. Please use image files (JPG, PNG, etc.)');
      }

      // Convert file to image data URL for better compatibility
      const imageDataUrl = await this.fileToDataURL(file);
      
      const { data: { text, confidence } } = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (m) => {
          console.log('OCR Status:', m.status, 'Progress:', Math.round(m.progress * 100) + '%');
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Enhanced OCR options for better accuracy
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-:() ',
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        preserve_interword_spaces: '1',
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
        // Better number recognition
        tessedit_char_blacklist: '|{}[]~`@#$%^&*+=<>?;:"\\',
        // Improve text recognition
        textord_min_linesize: '2.0',
        textord_tabfind_show_vlines: '0'
      });
      
      const processingTime = Date.now() - startTime;
      const parsedData = this.parseCertificateText(text);
      
      return {
        rawText: text,
        confidence: Math.round(confidence),
        parsedData,
        processingTime
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to extract text from document. Please ensure the file is a valid image.');
    }
  }

  private static isValidFileType(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff'
    ];
    return validTypes.includes(file.type.toLowerCase());
  }

  private static fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  static parseCertificateText(text: string): ParsedData {
    // Clean and normalize the text for better parsing
    const cleanedText = text
      .replace(/[^\w\s\-.,\/:()]/g, ' ') // Remove special characters except common ones
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Debug: Log the cleaned text for troubleshooting
    console.log('OCR Cleaned Text:', cleanedText);
    console.log('OCR Lines:', lines);
    
    // Debug: Look for date patterns in the text
    const datePatterns = [
      /(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{1,2}),\s+([0-9]{4})/i,
      /([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/,
      /(?:june|july|august|september|october|november|december|january|february|march|april|may)[\s,]*([0-9]{1,2}[,\s]*[0-9]{4})/i
    ];
    
    datePatterns.forEach((pattern, index) => {
      const match = cleanedText.match(pattern);
      if (match) {
        console.log(`Date Pattern ${index + 1} matched:`, match);
      }
    });
    
    // Enhanced regex patterns for certificate parsing
    const patterns = {
      studentName: [
        /(?:name|student|candidate)[\s:]*([A-Za-z\s]+(?:\([^)]+\))?)/i,
        /(?:this is to certify that|certify that)\s+([A-Za-z\s]+)/i,
        /(?:mr\.|ms\.|mrs\.)\s*([A-Za-z\s]+(?:\([^)]+\))?)/i,
        // More specific patterns to avoid institution names
        /(?:student[\s]*name|name)[\s:]*([A-Z][A-Za-z\s]+(?:PATIL|SINGH|KUMAR|SHARMA|GUPTA|VERMA|YADAV|AHMED|KHAN|ALI|JOSHI|MISHRA|TIWARI|MALIK|CHAUHAN|AGARWAL|JAIN|MEHTA|BANSAL|GOEL|ARORA|KAPOOR|REDDY|RAO|NAIDU|VENKAT|KRISHNA|RAM|LAKSHMI|DEVI|KUMARI))/i,
        // Pattern to match full names (3+ words starting with capital letters)
        /([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
        // Pattern to avoid institution names - look for names that don't contain "institute", "college", "university"
        /(?!.*(?:institute|college|university|technology|school|academy))([A-Z][A-Za-z\s]+(?:PATIL|SINGH|KUMAR|SHARMA|GUPTA|VERMA|YADAV|AHMED|KHAN|ALI))/i
      ],
      studentRoll: [
        /(?:roll|reg|registration)[\s:]*no[.\s:]*([A-Z0-9\-]+)/i,
        /(?:roll|reg|registration)[\s:]*([A-Z0-9\-]+)/i,
        /roll[\s:]*no[.\s:]*([A-Z0-9\-]+)/i,
        /([A-Z0-9]{8,12})/ // Generic pattern for roll numbers (8-12 chars)
      ],
      certificateNumber: [
        /(?:certificate|cert|degree|receipt)[\s:]*no[.\s:]*([A-Z0-9\-]+)/i,
        /certificate[\s:]*number[\s:]*([A-Z0-9\-]+)/i,
        /(?:certificate|cert)[\s:]*([A-Z0-9\-]+)/i,
        /receipt[\s:]*no[.\s:]*([A-Z0-9\-]+)/i,
        /([0-9]{6,})/ // Generic pattern for certificate numbers
      ],
      institutionName: [
        /(?:university|college|institute|school)[\s:]*([A-Za-z\s&.,]+)/i,
        /([A-Z][A-Za-z\s&.,]+(?:university|college|institute|school))/i,
        /(?:awarded by|issued by)[\s:]*([A-Za-z\s&.,]+)/i,
        /vidyalankar[\s\w]*institute/i,
        /([A-Z][A-Za-z\s]+(?:TECHNOLOGY|ENGINEERING|COLLEGE|UNIVERSITY))/i
      ],
      courseName: [
        /(?:course|degree|program)[\s:]*([A-Za-z\s&.,]+)/i,
        /(?:bachelor|master|diploma)[\s:]*of[\s:]*([A-Za-z\s&.,]+)/i,
        /(?:in|for)[\s:]*([A-Za-z\s&.,]+)/i,
        /(?:computer|mechanical|electrical|civil|electronics)[\s]*(?:engineering|science)/i,
        /(?:undergraduate|graduate)[\s:]*([A-Za-z\s&.,]+)/i
      ],
      marks: [
        /(?:marks|grade|cgpa|percentage)[\s:]*([0-9.]+)/i,
        /([0-9.]+)\s*(?:out of|\/|%)/,
        /(?:secured|obtained)[\s:]*([0-9.]+)/i,
        /total[\s:]*([0-9,]+)/i,
        /([0-9]+[.,][0-9]+)/ // Decimal numbers
      ],
      dateIssued: [
        /(?:date|issued|awarded)[\s:]*([0-9\/\-\.]+)/i,
        /([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/,
        /(?:on)[\s:]*([0-9\/\-\.]+)/i,
        /(?:june|july|august|september|october|november|december|january|february|march|april|may)[\s,]*([0-9]{1,2}[,\s]*[0-9]{4})/i,
        /([0-9]{4})/, // Year only
        // More specific date patterns
        /(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{1,2}),?\s+([0-9]{4})/i,
        /([0-9]{1,2})\s+(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{4})/i,
        // Pattern for "June 27, 2025" format
        /(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{1,2}),\s+([0-9]{4})/i
      ],
      uin: [
        /(?:uin|unique identification number)[\s:]*([A-Z0-9\-]+)/i,
        /(?:unique id|id)[\s:]*([A-Z0-9\-]+)/i,
        /([A-Z0-9]{8,})/ // Generic pattern for long alphanumeric strings
      ]
    };
    
    const extracted: ParsedData = {};
    
    // Try each pattern for each field with improved logic
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const line of lines) {
        for (const pattern of fieldPatterns) {
          const match = line.match(pattern);
          if (match && match[1] && match[1].trim().length > 2) {
            let value = match[1].trim();
            
            // Clean up the extracted value based on field type
            if (field === 'studentName') {
              value = value.replace(/\([^)]*\)$/, '').trim(); // Remove trailing parentheses
              value = value.replace(/^(mr\.|ms\.|mrs\.)\s*/i, ''); // Remove titles
              // Filter out institution-related words
              const institutionWords = ['institute', 'college', 'university', 'technology', 'school', 'academy', 'vidyalankar', 'engineering'];
              const words = value.split(' ').filter(word => 
                !institutionWords.some(inst => word.toLowerCase().includes(inst.toLowerCase()))
              );
              value = words.join(' ').trim();
            } else if (field === 'dateIssued') {
              // Handle different date formats
              if (value.includes(',')) {
                // Format like "June 27, 2025" - convert to "27/06/2025"
                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                                  'july', 'august', 'september', 'october', 'november', 'december'];
                const parts = value.toLowerCase().split(/[\s,]+/);
                if (parts.length >= 3) {
                  const monthIndex = monthNames.findIndex(month => parts[0].includes(month));
                  if (monthIndex !== -1) {
                    const day = parts[1].replace(/\D/g, '');
                    const year = parts[2].replace(/\D/g, '');
                    value = `${day}/${String(monthIndex + 1).padStart(2, '0')}/${year}`;
                  }
                }
              } else {
                value = value.replace(/[^\d\/\-\.]/g, ''); // Keep only date characters
              }
            } else if (field === 'marks') {
              value = value.replace(/[^\d.]/g, ''); // Keep only numbers and decimal
            } else if (field === 'studentRoll' || field === 'certificateNumber') {
              value = value.replace(/[^A-Z0-9\-]/g, ''); // Keep only alphanumeric and hyphens
            }
            
            if (value.length > 0) {
              extracted[field as keyof ParsedData] = value;
              break;
            }
          }
        }
        if (extracted[field as keyof ParsedData]) break;
      }
    }
    
    // Additional fallback patterns for common document types
    if (!extracted.studentRoll && !extracted.certificateNumber) {
      // Look for any long alphanumeric string that could be a roll number
      const rollMatch = cleanedText.match(/([A-Z0-9]{8,12})/);
      if (rollMatch) {
        extracted.studentRoll = rollMatch[1];
      }
    }
    
    if (!extracted.institutionName) {
      // Look for common institution keywords
      const instMatch = cleanedText.match(/([A-Za-z\s]+(?:institute|college|university|school))/i);
      if (instMatch) {
        extracted.institutionName = instMatch[1].trim();
      }
    }
    
    // Try to extract from form field patterns (for form-based documents)
    this.extractFromFormFields(cleanedText, extracted);
    
    // Special handling for receipt format like "Mr. NIKHIL SUREDRA PATIL (OPEN)"
    if (!extracted.studentName) {
      const receiptNameMatch = cleanedText.match(/(?:mr\.|ms\.|mrs\.)\s*([A-Z][A-Z\s]+(?:PATIL|SINGH|KUMAR|SHARMA|GUPTA|VERMA|YADAV|AHMED|KHAN|ALI|JOSHI|MISHRA|TIWARI|MALIK|CHAUHAN|AGARWAL|JAIN|MEHTA|BANSAL|GOEL|ARORA|KAPOOR|REDDY|RAO|NAIDU|VENKAT|KRISHNA|RAM|LAKSHMI|DEVI|KUMARI))/i);
      if (receiptNameMatch) {
        let name = receiptNameMatch[1].trim();
        // Remove any trailing parentheses content
        name = name.replace(/\s*\([^)]*\)$/, '').trim();
        // Filter out institution words
        const institutionWords = ['institute', 'college', 'university', 'technology', 'school', 'academy', 'vidyalankar', 'engineering'];
        const words = name.split(' ').filter(word => 
          !institutionWords.some(inst => word.toLowerCase().includes(inst.toLowerCase()))
        );
        extracted.studentName = words.join(' ').trim();
      }
    }

    // Special handling for receipt date format like "June 27, 2025"
    if (!extracted.dateIssued) {
      const receiptDateMatch = cleanedText.match(/(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{1,2}),\s+([0-9]{4})/i);
      if (receiptDateMatch) {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = monthNames.findIndex(month => 
          receiptDateMatch[0].toLowerCase().includes(month)
        );
        if (monthIndex !== -1) {
          const day = receiptDateMatch[1];
          const year = receiptDateMatch[2];
          extracted.dateIssued = `${day}/${String(monthIndex + 1).padStart(2, '0')}/${year}`;
        }
      }
    }
    
    return extracted;
  }

  private static extractFromFormFields(text: string, extracted: ParsedData): void {
    // Look for form field patterns like "Student Roll No: 2310240057"
    const formPatterns = {
      studentRoll: [
        /student[\s]*roll[\s]*no[:\s]*([A-Z0-9\-]+)/i,
        /roll[\s]*no[:\s]*([A-Z0-9\-]+)/i,
        /roll[\s]*number[:\s]*([A-Z0-9\-]+)/i
      ],
      studentName: [
        /student[\s]*name[:\s]*([A-Za-z\s]+(?:\([^)]+\))?)/i,
        /name[:\s]*([A-Za-z\s]+(?:\([^)]+\))?)/i,
        // Look for patterns like "Mr. NIKHIL SUREDRA PATIL (OPEN)"
        /(?:mr\.|ms\.|mrs\.)\s*([A-Z][A-Z\s]+(?:PATIL|SINGH|KUMAR|SHARMA|GUPTA|VERMA|YADAV|AHMED|KHAN|ALI|JOSHI|MISHRA|TIWARI|MALIK|CHAUHAN|AGARWAL|JAIN|MEHTA|BANSAL|GOEL|ARORA|KAPOOR|REDDY|RAO|NAIDU|VENKAT|KRISHNA|RAM|LAKSHMI|DEVI|KUMARI))/i
      ],
      institutionName: [
        /institution[:\s]*([A-Za-z\s&.,]+)/i,
        /college[:\s]*([A-Za-z\s&.,]+)/i,
        /university[:\s]*([A-Za-z\s&.,]+)/i,
        /vidyalankar[\s\w]*institute[\s\w]*technology/i
      ],
      dateIssued: [
        /issue[\s]*date[:\s]*([0-9\/\-\.]+)/i,
        /date[:\s]*([0-9\/\-\.]+)/i,
        /(?:june|july|august|september|october|november|december|january|february|march|april|may)[\s,]*([0-9]{1,2}[,\s]*[0-9]{4})/i,
        // More specific patterns for receipt dates
        /(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{1,2}),\s+([0-9]{4})/i,
        /([0-9]{1,2})\s+(?:june|july|august|september|october|november|december|january|february|march|april|may)\s+([0-9]{4})/i
      ],
      certificateNumber: [
        /receipt[\s]*no[:\s]*([0-9]+)/i,
        /certificate[\s]*no[:\s]*([A-Z0-9\-]+)/i,
        /certificate[\s]*number[:\s]*([A-Z0-9\-]+)/i
      ]
    };

    for (const [field, patterns] of Object.entries(formPatterns)) {
      if (!extracted[field as keyof ParsedData]) {
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1] && match[1].trim().length > 2) {
            let value = match[1].trim();
            
            // Additional cleaning for student names
            if (field === 'studentName') {
              // Remove institution-related words
              const institutionWords = ['institute', 'college', 'university', 'technology', 'school', 'academy', 'vidyalankar', 'engineering'];
              const words = value.split(' ').filter(word => 
                !institutionWords.some(inst => word.toLowerCase().includes(inst.toLowerCase()))
              );
              value = words.join(' ').trim();
              
              // Only accept if it looks like a real name (contains common Indian surnames)
              const hasValidSurname = /(?:PATIL|SINGH|KUMAR|SHARMA|GUPTA|VERMA|YADAV|AHMED|KHAN|ALI|JOSHI|MISHRA|TIWARI|MALIK|CHAUHAN|AGARWAL|JAIN|MEHTA|BANSAL|GOEL|ARORA|KAPOOR|REDDY|RAO|NAIDU|VENKAT|KRISHNA|RAM|LAKSHMI|DEVI|KUMARI)/i.test(value);
              if (hasValidSurname && value.length > 5) {
                extracted[field as keyof ParsedData] = value;
                break;
              }
            } else {
              extracted[field as keyof ParsedData] = value;
              break;
            }
          }
        }
      }
    }
  }
  
  static validateExtractedData(data: ParsedData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.studentName) errors.push('Student name not found');
    if (!data.studentRoll && !data.certificateNumber) errors.push('Roll number or certificate number not found');
    if (!data.institutionName) errors.push('Institution name not found');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static formatExtractedData(data: ParsedData): string {
    const fields = [
      { label: 'Student Name', value: data.studentName },
      { label: 'Roll Number', value: data.studentRoll },
      { label: 'Certificate Number', value: data.certificateNumber },
      { label: 'Institution', value: data.institutionName },
      { label: 'Course', value: data.courseName },
      { label: 'Marks', value: data.marks },
      { label: 'Date Issued', value: data.dateIssued },
      { label: 'UIN', value: data.uin }
    ];
    
    return fields
      .filter(field => field.value)
      .map(field => `${field.label}: ${field.value}`)
      .join('\n');
  }
}
