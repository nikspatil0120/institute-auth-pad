from flask import Blueprint, request, jsonify, current_app
import os
import cv2
import numpy as np
import pytesseract
from PIL import Image
import pdf2image
import re
from typing import Dict, List, Optional
import tempfile

ocr_bp = Blueprint('ocr', __name__, url_prefix='/api/ocr')

class OCRService:
    def __init__(self):
        # Configure Tesseract path (adjust for your system)
        # For Windows: r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        # For Linux/Mac: 'tesseract'
        self.tesseract_config = '--oem 3 --psm 6'
    
    def extract_text_from_image(self, image_path: str) -> Dict[str, any]:
        """Extract text from image using OCR"""
        try:
            # Preprocess image for better OCR
            image = self.preprocess_image(image_path)
            
            # Extract text using Tesseract
            text = pytesseract.image_to_string(image, config=self.tesseract_config)
            
            # Parse certificate data
            parsed_data = self.parse_certificate_text(text)
            
            return {
                'success': True,
                'raw_text': text,
                'parsed_data': parsed_data,
                'confidence': self.calculate_confidence(text)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, any]:
        """Extract text from PDF using OCR"""
        try:
            # Convert PDF to images
            images = pdf2image.convert_from_path(pdf_path)
            
            all_text = ""
            for image in images:
                # Convert PIL image to OpenCV format
                opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                
                # Preprocess image
                processed_image = self.preprocess_cv_image(opencv_image)
                
                # Extract text
                text = pytesseract.image_to_string(processed_image, config=self.tesseract_config)
                all_text += text + "\n"
            
            # Parse certificate data
            parsed_data = self.parse_certificate_text(all_text)
            
            return {
                'success': True,
                'raw_text': all_text,
                'parsed_data': parsed_data,
                'confidence': self.calculate_confidence(all_text)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def preprocess_image(self, image_path: str) -> Image.Image:
        """Preprocess image for better OCR results"""
        # Load image
        image = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply noise reduction
        denoised = cv2.medianBlur(gray, 3)
        
        # Apply thresholding
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Convert back to PIL Image
        return Image.fromarray(thresh)
    
    def preprocess_cv_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess OpenCV image for better OCR"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply noise reduction
        denoised = cv2.medianBlur(gray, 3)
        
        # Apply thresholding
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    
    def parse_certificate_text(self, text: str) -> Dict[str, str]:
        """Parse certificate text to extract structured data"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Define regex patterns for common certificate fields
        patterns = {
            'student_name': [
                r'(?:name|student|candidate)[\s:]*([A-Za-z\s]+)',
                r'([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                r'(?:this is to certify that|certify that)\s+([A-Za-z\s]+)'
            ],
            'student_roll': [
                r'(?:roll|reg|registration)[\s:]*no[.\s:]*([A-Z0-9\-]+)',
                r'(?:roll|reg|registration)[\s:]*([A-Z0-9\-]+)',
                r'roll[\s:]*no[.\s:]*([A-Z0-9\-]+)'
            ],
            'certificate_number': [
                r'(?:certificate|cert|degree)[\s:]*no[.\s:]*([A-Z0-9\-]+)',
                r'certificate[\s:]*number[\s:]*([A-Z0-9\-]+)',
                r'(?:certificate|cert)[\s:]*([A-Z0-9\-]+)'
            ],
            'institution_name': [
                r'(?:university|college|institute)[\s:]*([A-Za-z\s&.,]+)',
                r'([A-Z][A-Za-z\s&.,]+(?:university|college|institute))',
                r'(?:awarded by|issued by)[\s:]*([A-Za-z\s&.,]+)'
            ],
            'course_name': [
                r'(?:course|degree|program)[\s:]*([A-Za-z\s&.,]+)',
                r'(?:bachelor|master|diploma)[\s:]*of[\s:]*([A-Za-z\s&.,]+)',
                r'(?:in|for)[\s:]*([A-Za-z\s&.,]+)'
            ],
            'marks': [
                r'(?:marks|grade|cgpa|percentage)[\s:]*([0-9.]+)',
                r'([0-9.]+)\s*(?:out of|/|\%)',
                r'(?:secured|obtained)[\s:]*([0-9.]+)'
            ],
            'date_issued': [
                r'(?:date|issued|awarded)[\s:]*([0-9\/\-\.]+)',
                r'([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})',
                r'(?:on)[\s:]*([0-9\/\-\.]+)'
            ],
            'uin': [
                r'(?:uin|unique identification number)[\s:]*([A-Z0-9\-]+)',
                r'(?:unique id|id)[\s:]*([A-Z0-9\-]+)',
                r'([A-Z0-9]{8,})'  # Generic pattern for long alphanumeric strings
            ]
        }
        
        extracted_data = {}
        
        # Try each pattern for each field
        for field, field_patterns in patterns.items():
            for line in lines:
                for pattern in field_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match and match.group(1) and len(match.group(1).strip()) > 2:
                        extracted_data[field] = match.group(1).strip()
                        break
                if field in extracted_data:
                    break
        
        return extracted_data
    
    def calculate_confidence(self, text: str) -> float:
        """Calculate confidence score based on text quality"""
        if not text.strip():
            return 0.0
        
        # Simple confidence calculation based on text length and character patterns
        text_length = len(text.strip())
        alpha_chars = sum(1 for c in text if c.isalpha())
        digit_chars = sum(1 for c in text if c.isdigit())
        
        # Higher confidence for longer text with good alpha/digit ratio
        confidence = min(1.0, (text_length / 100) * (alpha_chars / max(1, alpha_chars + digit_chars)))
        return round(confidence * 100, 2)

# Initialize OCR service
ocr_service = OCRService()

@ocr_bp.route('/extract', methods=['POST'])
def extract_text_ocr():
    """Extract text from uploaded document using OCR"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
        file.save(temp_file.name)
        temp_path = temp_file.name
    
    try:
        # Determine file type and process accordingly
        if file.filename.lower().endswith('.pdf'):
            result = ocr_service.extract_text_from_pdf(temp_path)
        else:
            result = ocr_service.extract_text_from_image(temp_path)
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        return jsonify(result)
    
    except Exception as e:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        return jsonify({'error': str(e)}), 500

@ocr_bp.route('/validate', methods=['POST'])
def validate_ocr_data():
    """Validate OCR extracted data against stored document data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        ocr_data = data.get('ocr_data', {})
        stored_data = data.get('stored_data', {})
        
        # Compare fields
        comparison = {
            'student_name': ocr_data.get('student_name') == stored_data.get('student_name'),
            'student_roll': ocr_data.get('student_roll') == stored_data.get('student_roll'),
            'certificate_number': ocr_data.get('certificate_number') == stored_data.get('uin'),
            'uin': ocr_data.get('uin') == stored_data.get('uin'),
            'marks': ocr_data.get('marks') == str(stored_data.get('marks', '')),
            'date_issued': ocr_data.get('date_issued') == stored_data.get('date_issued')
        }
        
        matches = sum(1 for match in comparison.values() if match)
        total = len(comparison)
        match_percentage = round((matches / total) * 100, 2)
        
        return jsonify({
            'success': True,
            'comparison': comparison,
            'match_percentage': match_percentage,
            'matches': matches,
            'total_fields': total,
            'is_valid': match_percentage >= 70  # 70% threshold for validity
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ocr_bp.route('/batch-extract', methods=['POST'])
def batch_extract_ocr():
    """Extract text from multiple documents in batch"""
    try:
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        results = []
        
        for file in files:
            if file.filename == '':
                continue
                
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
                file.save(temp_file.name)
                temp_path = temp_file.name
            
            try:
                # Process file
                if file.filename.lower().endswith('.pdf'):
                    result = ocr_service.extract_text_from_pdf(temp_path)
                else:
                    result = ocr_service.extract_text_from_image(temp_path)
                
                result['filename'] = file.filename
                results.append(result)
                
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': str(e)
                })
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ocr_bp.route('/health', methods=['GET'])
def ocr_health():
    """Check OCR service health"""
    try:
        # Test OCR with a simple image
        test_image = np.ones((100, 300, 3), dtype=np.uint8) * 255
        cv2.putText(test_image, 'Test OCR', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Save test image temporarily
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            cv2.imwrite(temp_file.name, test_image)
            temp_path = temp_file.name
        
        try:
            result = ocr_service.extract_text_from_image(temp_path)
            success = result.get('success', False)
        finally:
            os.unlink(temp_path)
        
        return jsonify({
            'status': 'healthy' if success else 'unhealthy',
            'tesseract_available': success,
            'service': 'OCR Service'
        })
    
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'service': 'OCR Service'
        }), 500
