import cv2
import numpy as np
import json
import re
import io
import os
from datetime import datetime
from typing import Dict, List, Tuple, Any
import hashlib
from PIL import Image, ImageStat
import logging
import fitz  # PyMuPDF for PDF processing

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

class DocumentStructureAnalyzer:
    """Analyzes document structure for fraud detection"""
    
    def __init__(self):
        self.standard_margins = {'top': 50, 'bottom': 50, 'left': 50, 'right': 50}
        self.expected_font_sizes = {'title': 24, 'subtitle': 18, 'body': 12}
        
    def analyze(self, image_path: str) -> Dict[str, Any]:
        """Analyze document structure"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {'score': 0, 'issues': ['Invalid image file']}
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Analyze structure
            margin_analysis = self._analyze_margins(gray)
            text_density = self._analyze_text_density(gray)
            layout_consistency = self._analyze_layout_consistency(gray)
            
            # Calculate overall structure score
            structure_score = (
                margin_analysis['score'] * 0.3 +
                text_density['score'] * 0.4 +
                layout_consistency['score'] * 0.3
            )
            
            issues = []
            if margin_analysis['score'] < 0.7:
                issues.append("Irregular margins detected")
            if text_density['score'] < 0.6:
                issues.append("Unusual text density")
            if layout_consistency['score'] < 0.8:
                issues.append("Inconsistent layout structure")
            
            return {
                'score': structure_score,
                'issues': issues,
                'details': {
                    'margins': margin_analysis,
                    'text_density': text_density,
                    'layout': layout_consistency
                }
            }
            
        except Exception as e:
            logger.error(f"Structure analysis failed: {e}")
            return {'score': 0, 'issues': [f'Analysis error: {str(e)}']}
    
    def _analyze_margins(self, gray_image: np.ndarray) -> Dict[str, Any]:
        """Analyze document margins"""
        height, width = gray_image.shape
        
        # Detect text boundaries
        edges = cv2.Canny(gray_image, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {'score': 0, 'issues': ['No text detected']}
        
        # Find bounding box of all text
        x_coords = []
        y_coords = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            x_coords.extend([x, x + w])
            y_coords.extend([y, y + h])
        
        if not x_coords or not y_coords:
            return {'score': 0, 'issues': ['No text boundaries found']}
        
        left_margin = min(x_coords)
        right_margin = width - max(x_coords)
        top_margin = min(y_coords)
        bottom_margin = height - max(y_coords)
        
        # Check if margins are reasonable
        margin_score = 1.0
        if left_margin < 20 or right_margin < 20:
            margin_score -= 0.3
        if top_margin < 20 or bottom_margin < 20:
            margin_score -= 0.3
        
        return {
            'score': max(0, margin_score),
            'margins': {
                'left': left_margin,
                'right': right_margin,
                'top': top_margin,
                'bottom': bottom_margin
            }
        }
    
    def _analyze_text_density(self, gray_image: np.ndarray) -> Dict[str, Any]:
        """Analyze text density distribution"""
        # Apply threshold to get binary image
        _, binary = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY_INV)
        
        # Calculate text density
        text_pixels = np.sum(binary == 255)
        total_pixels = binary.shape[0] * binary.shape[1]
        density = text_pixels / total_pixels
        
        # Normal density should be between 0.1 and 0.4
        if 0.1 <= density <= 0.4:
            density_score = 1.0
        elif density < 0.05 or density > 0.6:
            density_score = 0.3
        else:
            density_score = 0.7
        
        return {
            'score': density_score,
            'density': density,
            'text_pixels': int(text_pixels),
            'total_pixels': int(total_pixels)
        }
    
    def _analyze_layout_consistency(self, gray_image: np.ndarray) -> Dict[str, Any]:
        """Analyze layout consistency"""
        # Detect horizontal and vertical lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
        
        horizontal_lines = cv2.morphologyEx(gray_image, cv2.MORPH_OPEN, horizontal_kernel)
        vertical_lines = cv2.morphologyEx(gray_image, cv2.MORPH_OPEN, vertical_kernel)
        
        # Count lines
        h_lines = len(cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0])
        v_lines = len(cv2.findContours(vertical_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0])
        
        # Check for reasonable line count (certificates usually have some structure)
        if 2 <= h_lines <= 10 and 0 <= v_lines <= 5:
            layout_score = 1.0
        elif h_lines > 15 or v_lines > 10:
            layout_score = 0.4  # Too many lines might indicate tampering
        else:
            layout_score = 0.7
        
        return {
            'score': layout_score,
            'horizontal_lines': h_lines,
            'vertical_lines': v_lines
        }

class ContentPatternValidator:
    """Validates content patterns for fraud detection"""
    
    def __init__(self):
        self.institution_patterns = [
            r'(?i)(university|college|institute|school|academy)',
            r'(?i)(technology|engineering|science|arts|commerce)',
            r'(?i)(bachelor|master|diploma|certificate)'
        ]
        self.date_patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
            r'\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}',
            r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}'
        ]
        self.grade_patterns = [
            r'\d+\.?\d*\s*(out of|/)\s*\d+',
            r'[A-F][+-]?',
            r'\d+%',
            r'(first|second|third|distinction|pass)'
        ]
    
    def validate(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate content patterns"""
        issues = []
        scores = []
        
        # Validate institution name
        inst_score = self._validate_institution(extracted_data.get('institutionName', ''))
        scores.append(inst_score['score'])
        issues.extend(inst_score['issues'])
        
        # Validate date format
        date_score = self._validate_date(extracted_data.get('dateIssued', ''))
        scores.append(date_score['score'])
        issues.extend(date_score['issues'])
        
        # Validate grade/marks
        grade_score = self._validate_grade(extracted_data.get('marks', ''))
        scores.append(grade_score['score'])
        issues.extend(grade_score['issues'])
        
        # Validate student name
        name_score = self._validate_name(extracted_data.get('studentName', ''))
        scores.append(name_score['score'])
        issues.extend(name_score['issues'])
        
        # Calculate overall content score
        content_score = sum(scores) / len(scores) if scores else 0
        
        return {
            'score': content_score,
            'issues': issues,
            'details': {
                'institution': inst_score,
                'date': date_score,
                'grade': grade_score,
                'name': name_score
            }
        }
    
    def _validate_institution(self, institution: str) -> Dict[str, Any]:
        """Validate institution name pattern"""
        if not institution:
            return {'score': 0, 'issues': ['Institution name missing']}
        
        issues = []
        score = 1.0
        
        # Check for institution keywords
        has_institution_keyword = any(re.search(pattern, institution) for pattern in self.institution_patterns)
        if not has_institution_keyword:
            issues.append('Institution name lacks standard keywords')
            score -= 0.3
        
        # Check length (should be reasonable)
        if len(institution) < 5 or len(institution) > 100:
            issues.append('Institution name length unusual')
            score -= 0.2
        
        # Check for suspicious patterns
        if re.search(r'(?i)(fake|test|sample|demo)', institution):
            issues.append('Suspicious institution name detected')
            score = 0.1
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_date(self, date_str: str) -> Dict[str, Any]:
        """Validate date format and reasonableness"""
        if not date_str:
            return {'score': 0, 'issues': ['Date missing']}
        
        issues = []
        score = 1.0
        
        # Check if date matches expected patterns
        has_valid_format = any(re.search(pattern, date_str) for pattern in self.date_patterns)
        if not has_valid_format:
            issues.append('Date format unusual')
            score -= 0.4
        
        # Check if date is reasonable (not too far in future/past)
        try:
            # Try to parse date
            current_year = datetime.now().year
            year_match = re.search(r'(\d{4})', date_str)
            if year_match:
                year = int(year_match.group(1))
                if year < 1950 or year > current_year + 5:
                    issues.append('Date seems unreasonable')
                    score -= 0.3
        except:
            issues.append('Date parsing failed')
            score -= 0.2
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_grade(self, grade_str: str) -> Dict[str, Any]:
        """Validate grade/marks format"""
        if not grade_str:
            return {'score': 0.5, 'issues': ['Grade/marks missing']}  # Not critical
        
        issues = []
        score = 1.0
        
        # Check for valid grade patterns
        has_valid_grade = any(re.search(pattern, grade_str, re.IGNORECASE) for pattern in self.grade_patterns)
        if not has_valid_grade:
            issues.append('Grade format unusual')
            score -= 0.3
        
        # Check for suspicious values
        if re.search(r'(?i)(perfect|100%|excellent)', grade_str):
            # Perfect scores are suspicious but not necessarily fraudulent
            score -= 0.1
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_name(self, name: str) -> Dict[str, Any]:
        """Validate student name"""
        if not name:
            return {'score': 0, 'issues': ['Student name missing']}
        
        issues = []
        score = 1.0
        
        # Check length
        if len(name) < 2 or len(name) > 50:
            issues.append('Name length unusual')
            score -= 0.2
        
        # Check for valid characters (letters, spaces, common punctuation)
        if not re.match(r'^[A-Za-z\s\.\-\'\(\)]+$', name):
            issues.append('Name contains invalid characters')
            score -= 0.3
        
        # Check for suspicious patterns
        if re.search(r'(?i)(test|sample|fake|demo|admin)', name):
            issues.append('Suspicious name detected')
            score = 0.2
        
        return {'score': max(0, score), 'issues': issues}

class ImageForensicsAnalyzer:
    """Analyzes image for tampering and forensics"""
    
    def __init__(self):
        self.compression_threshold = 0.8
        self.noise_threshold = 0.1
    
    def detect_tampering(self, image_path: str) -> Dict[str, Any]:
        """Detect image tampering"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {'score': 0, 'issues': ['Invalid image file']}
            
            # Convert to different color spaces
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Run various forensics tests
            compression_analysis = self._analyze_compression_artifacts(image)
            noise_analysis = self._analyze_noise_patterns(gray)
            color_analysis = self._analyze_color_consistency(hsv)
            edge_analysis = self._analyze_edge_consistency(gray)
            
            # Calculate overall forensics score
            forensics_score = (
                compression_analysis['score'] * 0.3 +
                noise_analysis['score'] * 0.3 +
                color_analysis['score'] * 0.2 +
                edge_analysis['score'] * 0.2
            )
            
            issues = []
            if compression_analysis['score'] < 0.7:
                issues.append("Compression artifacts detected")
            if noise_analysis['score'] < 0.6:
                issues.append("Unusual noise patterns")
            if color_analysis['score'] < 0.8:
                issues.append("Color inconsistencies detected")
            if edge_analysis['score'] < 0.7:
                issues.append("Edge tampering signs")
            
            return {
                'score': forensics_score,
                'issues': issues,
                'details': {
                    'compression': compression_analysis,
                    'noise': noise_analysis,
                    'color': color_analysis,
                    'edges': edge_analysis
                }
            }
            
        except Exception as e:
            logger.error(f"Forensics analysis failed: {e}")
            return {'score': 0, 'issues': [f'Analysis error: {str(e)}']}
    
    def _analyze_compression_artifacts(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze compression artifacts"""
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply DCT to detect compression artifacts
        dct = cv2.dct(np.float32(gray))
        
        # Analyze high-frequency components
        high_freq_energy = np.sum(np.abs(dct[8:, 8:]))
        total_energy = np.sum(np.abs(dct))
        
        compression_ratio = high_freq_energy / total_energy if total_energy > 0 else 0
        
        # High compression ratio might indicate tampering
        if compression_ratio > 0.3:
            score = 0.3
        elif compression_ratio > 0.2:
            score = 0.6
        else:
            score = 1.0
        
        return {
            'score': score,
            'compression_ratio': compression_ratio,
            'high_freq_energy': float(high_freq_energy),
            'total_energy': float(total_energy)
        }
    
    def _analyze_noise_patterns(self, gray_image: np.ndarray) -> Dict[str, Any]:
        """Analyze noise patterns"""
        # Apply Gaussian blur and subtract to get noise
        blurred = cv2.GaussianBlur(gray_image, (5, 5), 0)
        noise = cv2.absdiff(gray_image, blurred)
        
        # Calculate noise statistics
        noise_mean = np.mean(noise)
        noise_std = np.std(noise)
        
        # Normal noise should have certain characteristics
        if 5 <= noise_mean <= 15 and 10 <= noise_std <= 30:
            score = 1.0
        elif noise_mean < 2 or noise_mean > 25:
            score = 0.4  # Very low or very high noise
        else:
            score = 0.7
        
        return {
            'score': score,
            'noise_mean': float(noise_mean),
            'noise_std': float(noise_std)
        }
    
    def _analyze_color_consistency(self, hsv_image: np.ndarray) -> Dict[str, Any]:
        """Analyze color consistency"""
        # Split HSV channels
        h, s, v = cv2.split(hsv_image)
        
        # Calculate color statistics
        h_mean, h_std = np.mean(h), np.std(h)
        s_mean, s_std = np.mean(s), np.std(s)
        v_mean, v_std = np.mean(v), np.std(v)
        
        # Check for unusual color variations
        score = 1.0
        if h_std > 50:  # High hue variation
            score -= 0.2
        if s_std > 40:  # High saturation variation
            score -= 0.2
        if v_std > 60:  # High value variation
            score -= 0.2
        
        return {
            'score': max(0, score),
            'hue_stats': {'mean': float(h_mean), 'std': float(h_std)},
            'saturation_stats': {'mean': float(s_mean), 'std': float(s_std)},
            'value_stats': {'mean': float(v_mean), 'std': float(v_std)}
        }
    
    def _analyze_edge_consistency(self, gray_image: np.ndarray) -> Dict[str, Any]:
        """Analyze edge consistency"""
        # Detect edges
        edges = cv2.Canny(gray_image, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {'score': 0.5, 'issues': ['No edges detected']}
        
        # Analyze contour properties
        areas = [cv2.contourArea(contour) for contour in contours]
        perimeters = [cv2.arcLength(contour, True) for contour in contours]
        
        # Check for unusual edge patterns
        if len(contours) > 1000:  # Too many small contours
            score = 0.3
        elif len(contours) < 5:  # Too few contours
            score = 0.6
        else:
            score = 1.0
        
        return {
            'score': score,
            'contour_count': len(contours),
            'avg_area': float(np.mean(areas)) if areas else 0,
            'avg_perimeter': float(np.mean(perimeters)) if perimeters else 0
        }

class FraudClassificationModel:
    """Machine learning model for fraud classification"""
    
    def __init__(self):
        # Simple rule-based model (can be replaced with actual ML model)
        self.weights = {
            'structure': 0.4,
            'content': 0.3,
            'forensics': 0.3
        }
        self.thresholds = {
            'low': 0.7,
            'medium': 0.5,
            'high': 0.3
        }
    
    def predict(self, structure_score: float, content_score: float, forensics_score: float) -> Dict[str, Any]:
        """Predict fraud probability"""
        # Calculate weighted score
        fraud_score = (
            structure_score * self.weights['structure'] +
            content_score * self.weights['content'] +
            forensics_score * self.weights['forensics']
        )
        
        # Determine risk level
        if fraud_score >= self.thresholds['low']:
            risk_level = 'LOW'
        elif fraud_score >= self.thresholds['medium']:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
        
        # Calculate fraud probability (inverse of score)
        fraud_probability = 1 - fraud_score
        
        return {
            'fraud_probability': fraud_probability,
            'risk_level': risk_level,
            'confidence_score': fraud_score,
            'individual_scores': {
                'structure': structure_score,
                'content': content_score,
                'forensics': forensics_score
            }
        }

class FraudDetectionService:
    """Main fraud detection service"""
    
    def __init__(self):
        self.structure_analyzer = DocumentStructureAnalyzer()
        self.content_validator = ContentPatternValidator()
        self.image_forensics = ImageForensicsAnalyzer()
        self.ml_classifier = FraudClassificationModel()
    
    def _convert_pdf_to_image(self, pdf_path: str) -> str:
        """Convert PDF to image for fraud detection"""
        try:
            # Open PDF document
            pdf_document = fitz.open(pdf_path)
            
            # Get first page
            page = pdf_document[0]
            
            # Convert page to image
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # Save as temporary image file
            image_path = pdf_path.replace('.pdf', '_converted.png')
            img.save(image_path, 'PNG')
            
            # Close PDF document
            pdf_document.close()
            
            return image_path
            
        except Exception as e:
            logger.error(f"PDF to image conversion failed: {e}")
            raise Exception(f"Failed to convert PDF to image: {str(e)}")
    
    def analyze_document(self, file_path: str, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive fraud analysis"""
        try:
            logger.info(f"Starting fraud analysis for: {file_path}")
            
            # Convert PDF to image if necessary
            analysis_path = file_path
            converted_image_path = None
            
            if file_path.lower().endswith('.pdf'):
                logger.info("Converting PDF to image for fraud analysis")
                analysis_path = self._convert_pdf_to_image(file_path)
                converted_image_path = analysis_path
            
            # Run all analyses
            structure_result = self.structure_analyzer.analyze(analysis_path)
            content_result = self.content_validator.validate(extracted_data)
            forensics_result = self.image_forensics.detect_tampering(analysis_path)
            
            # Get ML prediction
            ml_result = self.ml_classifier.predict(
                structure_result['score'],
                content_result['score'],
                forensics_result['score']
            )
            
            # Compile all issues
            all_issues = []
            all_issues.extend(structure_result.get('issues', []))
            all_issues.extend(content_result.get('issues', []))
            all_issues.extend(forensics_result.get('issues', []))
            
            # Generate recommendations
            recommendations = self._generate_recommendations(ml_result['risk_level'], all_issues)
            
            result = {
                'fraud_probability': ml_result['fraud_probability'],
                'risk_level': ml_result['risk_level'],
                'confidence_score': ml_result['confidence_score'],
                'detected_issues': all_issues,
                'recommendations': recommendations,
                'analysis_details': {
                    'structure': structure_result,
                    'content': content_result,
                    'forensics': forensics_result,
                    'ml_classification': ml_result
                },
                'timestamp': datetime.now().isoformat(),
                'analysis_id': self._generate_analysis_id(file_path)
            }
            
            # Convert numpy types to JSON-serializable types
            result = convert_numpy_types(result)
            
            logger.info(f"Fraud analysis completed. Risk level: {ml_result['risk_level']}")
            return result
            
        except Exception as e:
            logger.error(f"Fraud analysis failed: {e}")
            error_result = {
                'fraud_probability': 0.5,
                'risk_level': 'MEDIUM',
                'confidence_score': 0.0,
                'detected_issues': [f'Analysis failed: {str(e)}'],
                'recommendations': ['Manual verification required due to analysis failure'],
                'analysis_details': {
                    'error': str(e),
                    'structure': {'score': 0, 'issues': ['Analysis failed']},
                    'content': {'score': 0, 'issues': ['Analysis failed']},
                    'forensics': {'score': 0, 'issues': ['Analysis failed']},
                    'ml_classification': {'fraud_probability': 0.5, 'risk_level': 'MEDIUM', 'confidence_score': 0.0}
                },
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            return convert_numpy_types(error_result)
        finally:
            # Clean up converted image file if it was created
            if converted_image_path and os.path.exists(converted_image_path):
                try:
                    os.remove(converted_image_path)
                    logger.info(f"Cleaned up converted image: {converted_image_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup converted image: {cleanup_error}")
    
    def _generate_recommendations(self, risk_level: str, issues: List[str]) -> List[str]:
        """Generate recommendations based on risk level and issues"""
        recommendations = []
        
        if risk_level == 'HIGH':
            recommendations.extend([
                'Immediate manual verification required',
                'Contact issuing institution for verification',
                'Request additional supporting documents',
                'Flag for security review'
            ])
        elif risk_level == 'MEDIUM':
            recommendations.extend([
                'Manual review recommended',
                'Verify with issuing institution',
                'Check document authenticity'
            ])
        else:
            recommendations.extend([
                'Document appears authentic',
                'Standard verification process sufficient'
            ])
        
        # Add specific recommendations based on issues
        if any('tampering' in issue.lower() for issue in issues):
            recommendations.append('Image forensics analysis required')
        if any('format' in issue.lower() for issue in issues):
            recommendations.append('Verify document format with institution')
        if any('suspicious' in issue.lower() for issue in issues):
            recommendations.append('Enhanced verification process required')
        
        return recommendations
    
    def _generate_analysis_id(self, image_path: str) -> str:
        """Generate unique analysis ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(image_path.encode()).hexdigest()[:8]
        return f"fraud_analysis_{timestamp}_{file_hash}"
    
    def get_fraud_statistics(self) -> Dict[str, Any]:
        """Get fraud detection statistics"""
        # This would typically query a database
        return {
            'total_analyses': 0,
            'high_risk_documents': 0,
            'medium_risk_documents': 0,
            'low_risk_documents': 0,
            'common_issues': [],
            'detection_accuracy': 0.0
        }
