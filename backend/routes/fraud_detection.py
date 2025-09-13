from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from services.fraud_detection import FraudDetectionService
from database import db
from models.legacy_document import LegacyDocument
from models.fraud_detection import FraudDetectionLog
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fraud_bp = Blueprint('fraud', __name__)

# Initialize fraud detection service
fraud_service = FraudDetectionService()

# Allowed file extensions for fraud detection
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@fraud_bp.route('/fraud/detect', methods=['POST'])
def detect_fraud():
    """Detect fraud in uploaded document"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only image files are allowed.'}), 400
        
        # Get extracted data from request
        extracted_data = request.form.get('extracted_data')
        if extracted_data:
            try:
                extracted_data = json.loads(extracted_data)
            except json.JSONDecodeError:
                extracted_data = {}
        else:
            extracted_data = {}
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_filename = f"fraud_analysis_{timestamp}_{filename}"
        temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_filename)
        
        file.save(temp_path)
        
        try:
            # Perform fraud detection
            fraud_result = fraud_service.analyze_document(temp_path, extracted_data)
            
            # Save fraud detection log to database
            fraud_log = FraudDetectionLog(
                document_id=None,  # Will be set if document exists
                fraud_score=fraud_result['fraud_probability'],
                risk_level=fraud_result['risk_level'],
                confidence_score=fraud_result['confidence_score'],
                detected_issues=json.dumps(fraud_result['detected_issues']),
                analysis_details=json.dumps(fraud_result['analysis_details']),
                recommendations=json.dumps(fraud_result['recommendations']),
                analysis_timestamp=datetime.now()
            )
            
            db.session.add(fraud_log)
            db.session.commit()
            
            # Add log ID to result
            fraud_result['log_id'] = fraud_log.id
            
            logger.info(f"Fraud detection completed for {filename}. Risk level: {fraud_result['risk_level']}")
            
            return jsonify({
                'success': True,
                'fraud_analysis': fraud_result
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        logger.error(f"Fraud detection failed: {e}")
        return jsonify({
            'success': False,
            'error': f'Fraud detection failed: {str(e)}'
        }), 500

@fraud_bp.route('/fraud/validate/<int:document_id>', methods=['POST'])
def validate_document(document_id):
    """Validate existing document for fraud"""
    try:
        # Get document from database
        document = LegacyDocument.query.get(document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Check if document has file path
        if not document.file_path or not os.path.exists(document.file_path):
            return jsonify({'error': 'Document file not found'}), 404
        
        # Prepare extracted data from document
        extracted_data = {
            'studentName': document.student_name,
            'studentRoll': document.student_roll,
            'certificateNumber': document.uin,
            'institutionName': document.institute_name,
            'courseName': document.doc_type,
            'marks': str(document.marks) if document.marks is not None else '',
            'dateIssued': document.date_issued.isoformat() if document.date_issued else None,
            'uin': document.uin
        }
        
        # Perform fraud detection
        fraud_result = fraud_service.analyze_document(document.file_path, extracted_data)
        
        # Update document with fraud analysis results
        document.fraud_risk = fraud_result.get('risk_level', 'MEDIUM')
        document.fraud_score = fraud_result.get('fraud_probability', 0.5)
        document.fraud_analysis = json.dumps(fraud_result.get('analysis_details', {}))
        document.requires_manual_review = fraud_result.get('risk_level', 'MEDIUM') in ['HIGH', 'MEDIUM']
        
        # Save fraud detection log
        fraud_log = FraudDetectionLog(
            document_id=document_id,
            fraud_score=fraud_result.get('fraud_probability', 0.5),
            risk_level=fraud_result.get('risk_level', 'MEDIUM'),
            confidence_score=fraud_result.get('confidence_score', 0.0),
            detected_issues=json.dumps(fraud_result.get('detected_issues', [])),
            analysis_details=json.dumps(fraud_result.get('analysis_details', {})),
            recommendations=json.dumps(fraud_result.get('recommendations', [])),
            analysis_timestamp=datetime.now()
        )
        
        db.session.add(fraud_log)
        db.session.commit()
        
        logger.info(f"Document {document_id} validated. Risk level: {fraud_result.get('risk_level', 'MEDIUM')}")
        
        return jsonify({
            'success': True,
            'fraud_analysis': fraud_result,
            'document_updated': True
        }), 200
    
    except Exception as e:
        logger.error(f"Document validation failed: {e}")
        return jsonify({
            'success': False,
            'error': f'Document validation failed: {str(e)}'
        }), 500

@fraud_bp.route('/fraud/report', methods=['POST'])
def report_fraud():
    """Report fraudulent document for pattern learning"""
    try:
        data = request.get_json()
        
        required_fields = ['document_id', 'fraud_type', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get document
        document = LegacyDocument.query.get(data['document_id'])
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Update document with fraud report
        document.fraud_risk = 'HIGH'
        document.fraud_score = 1.0  # Confirmed fraud
        document.requires_manual_review = True
        
        # Create fraud report log
        fraud_log = FraudDetectionLog(
            document_id=data['document_id'],
            fraud_score=1.0,
            risk_level='HIGH',
            confidence_score=1.0,
            detected_issues=json.dumps([f"Reported fraud: {data['fraud_type']}"]),
            analysis_details=json.dumps({
                'fraud_type': data['fraud_type'],
                'description': data['description'],
                'reported_by': data.get('reported_by', 'anonymous'),
                'report_timestamp': datetime.now().isoformat()
            }),
            recommendations=json.dumps(['Document confirmed as fraudulent', 'Update fraud patterns']),
            analysis_timestamp=datetime.now()
        )
        
        db.session.add(fraud_log)
        db.session.commit()
        
        logger.info(f"Fraud reported for document {data['document_id']}: {data['fraud_type']}")
        
        return jsonify({
            'success': True,
            'message': 'Fraud report submitted successfully',
            'log_id': fraud_log.id
        }), 200
    
    except Exception as e:
        logger.error(f"Fraud reporting failed: {e}")
        return jsonify({
            'success': False,
            'error': f'Fraud reporting failed: {str(e)}'
        }), 500

@fraud_bp.route('/fraud/analysis/<int:log_id>', methods=['GET'])
def get_fraud_analysis(log_id):
    """Get detailed fraud analysis by log ID"""
    try:
        fraud_log = FraudDetectionLog.query.get(log_id)
        if not fraud_log:
            return jsonify({'error': 'Fraud analysis not found'}), 404
        
        return jsonify({
            'success': True,
            'analysis': {
                'id': fraud_log.id,
                'document_id': fraud_log.document_id,
                'fraud_score': fraud_log.fraud_score,
                'risk_level': fraud_log.risk_level,
                'confidence_score': fraud_log.confidence_score,
                'detected_issues': json.loads(fraud_log.detected_issues),
                'analysis_details': json.loads(fraud_log.analysis_details),
                'recommendations': json.loads(fraud_log.recommendations),
                'timestamp': fraud_log.analysis_timestamp.isoformat()
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Failed to get fraud analysis: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to get fraud analysis: {str(e)}'
        }), 500

@fraud_bp.route('/fraud/statistics', methods=['GET'])
def get_fraud_statistics():
    """Get fraud detection statistics"""
    try:
        # Get statistics from database
        total_analyses = FraudDetectionLog.query.count()
        high_risk = FraudDetectionLog.query.filter_by(risk_level='HIGH').count()
        medium_risk = FraudDetectionLog.query.filter_by(risk_level='MEDIUM').count()
        low_risk = FraudDetectionLog.query.filter_by(risk_level='LOW').count()
        
        # Get common issues
        all_logs = FraudDetectionLog.query.all()
        issue_counts = {}
        for log in all_logs:
            issues = json.loads(log.detected_issues)
            for issue in issues:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1
        
        common_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Calculate detection accuracy (simplified)
        confirmed_frauds = FraudDetectionLog.query.filter(
            FraudDetectionLog.fraud_score >= 0.8
        ).count()
        
        accuracy = (confirmed_frauds / total_analyses * 100) if total_analyses > 0 else 0
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_analyses': total_analyses,
                'high_risk_documents': high_risk,
                'medium_risk_documents': medium_risk,
                'low_risk_documents': low_risk,
                'common_issues': [{'issue': issue, 'count': count} for issue, count in common_issues],
                'detection_accuracy': round(accuracy, 2)
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Failed to get fraud statistics: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to get fraud statistics: {str(e)}'
        }), 500

@fraud_bp.route('/fraud/health', methods=['GET'])
def fraud_health_check():
    """Health check for fraud detection service"""
    try:
        # Test fraud detection service
        stats = fraud_service.get_fraud_statistics()
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'service': 'fraud_detection',
            'version': '1.0.0',
            'statistics': stats
        }), 200
    
    except Exception as e:
        logger.error(f"Fraud detection health check failed: {e}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@fraud_bp.route('/fraud/batch-analyze', methods=['POST'])
def batch_analyze_documents():
    """Batch analyze multiple documents for fraud"""
    try:
        data = request.get_json()
        document_ids = data.get('document_ids', [])
        
        if not document_ids:
            return jsonify({'error': 'No document IDs provided'}), 400
        
        results = []
        for doc_id in document_ids:
            try:
                # Get document
                document = LegacyDocument.query.get(doc_id)
                if not document:
                    results.append({
                        'document_id': doc_id,
                        'success': False,
                        'error': 'Document not found'
                    })
                    continue
                
                # Prepare extracted data
                extracted_data = {
                    'studentName': document.student_name,
                    'studentRoll': document.roll_number,
                    'certificateNumber': document.certificate_number,
                    'institutionName': document.institution_name,
                    'courseName': document.course_name,
                    'marks': document.marks,
                    'dateIssued': document.date_issued,
                    'uin': document.uin
                }
                
                # Perform fraud detection
                fraud_result = fraud_service.analyze_document(document.file_path, extracted_data)
                
                # Update document
                document.fraud_risk = fraud_result['risk_level']
                document.fraud_score = fraud_result['fraud_probability']
                document.fraud_analysis = json.dumps(fraud_result['analysis_details'])
                document.requires_manual_review = fraud_result['risk_level'] in ['HIGH', 'MEDIUM']
                
                # Save log
                fraud_log = FraudDetectionLog(
                    document_id=doc_id,
                    fraud_score=fraud_result['fraud_probability'],
                    risk_level=fraud_result['risk_level'],
                    confidence_score=fraud_result['confidence_score'],
                    detected_issues=json.dumps(fraud_result['detected_issues']),
                    analysis_details=json.dumps(fraud_result['analysis_details']),
                    recommendations=json.dumps(fraud_result['recommendations']),
                    analysis_timestamp=datetime.now()
                )
                
                db.session.add(fraud_log)
                
                results.append({
                    'document_id': doc_id,
                    'success': True,
                    'fraud_analysis': fraud_result
                })
                
            except Exception as e:
                results.append({
                    'document_id': doc_id,
                    'success': False,
                    'error': str(e)
                })
        
        db.session.commit()
        
        logger.info(f"Batch analysis completed for {len(document_ids)} documents")
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results)
        }), 200
    
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        return jsonify({
            'success': False,
            'error': f'Batch analysis failed: {str(e)}'
        }), 500
