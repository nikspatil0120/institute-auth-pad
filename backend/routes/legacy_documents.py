from flask import Blueprint, request, jsonify, current_app
from database import db
from models.legacy_document import LegacyDocument
from models.institute import Institute
from blockchain.ledger import add_to_ledger
from utils.pdf_tools import generate_blockchain_hash
from utils.pdf_tools import add_watermark_and_qr
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import qrcode
from io import BytesIO
import base64
import jwt

legacy_documents_bp = Blueprint('legacy_documents', __name__)

def get_current_institute():
    """Get current institute from JWT token"""
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        # Decode JWT token
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        institute_id = payload.get('institute_id')
        
        if not institute_id:
            return None
        
        # Get institute from database
        institute = Institute.query.get(institute_id)
        return institute
        
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return None

@legacy_documents_bp.route('/legacy/check-uin/<uin>', methods=['GET'])
def check_uin_exists(uin):
    """Check if a UIN already exists"""
    try:
        existing_doc = LegacyDocument.query.filter_by(uin=uin).first()
        if existing_doc:
            return jsonify({
                'exists': True,
                'document': {
                    'id': existing_doc.id,
                    'student_name': existing_doc.student_name,
                    'status': existing_doc.status,
                    'date_created': existing_doc.created_at.isoformat() if existing_doc.created_at else None
                }
            }), 200
        else:
            return jsonify({'exists': False}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/request', methods=['POST'])
def create_legacy_request():
    """Create a new legacy document verification request"""
    try:
        data = request.form.to_dict()
        file = request.files.get('document')
        
        if not file or file.filename == '':
            return jsonify({'error': 'Document file is required'}), 400
        
        # Validate required fields
        required_fields = ['student_name', 'student_roll', 'doc_type', 'uin', 'date_issued', 'institute_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get institute
        institute = Institute.query.get(int(data['institute_id']))
        if not institute:
            return jsonify({'error': 'Institute not found'}), 404
        
        # Validate marks for marksheets
        marks = None
        if data['doc_type'] == 'marksheet':
            if not data.get('marks'):
                return jsonify({'error': 'Marks are required for marksheets'}), 400
            try:
                marks = float(data['marks'])
            except ValueError:
                return jsonify({'error': 'Invalid marks format'}), 400
        
        # Parse date
        try:
            date_issued = datetime.strptime(data['date_issued'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check if UIN already exists
        existing_doc = LegacyDocument.query.filter_by(uin=data['uin']).first()
        if existing_doc:
            return jsonify({
                'error': f'A document with UIN {data["uin"]} already exists. Each UIN can only have one document.',
                'existing_document': {
                    'id': existing_doc.id,
                    'student_name': existing_doc.student_name,
                    'status': existing_doc.status,
                    'date_created': existing_doc.created_at.isoformat() if existing_doc.created_at else None
                }
            }), 409  # Conflict status code
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = f"legacy_{uuid.uuid4().hex}_{filename}"
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(upload_path)
        
        # Create legacy document record
        legacy_doc = LegacyDocument(
            institute_id=institute.id,  # Associated with the institute that creates it
            student_name=data['student_name'],
            student_roll=data['student_roll'],
            doc_type=data['doc_type'],
            marks=marks,
            uin=data['uin'],
            date_issued=date_issued,
            institute_name=institute.name,
            file_path=upload_path,
            status='pending'
        )
        
        db.session.add(legacy_doc)
        db.session.commit()
        
        return jsonify({
            'message': 'Legacy document request submitted successfully',
            'request_id': legacy_doc.id,
            'status': 'unverified'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/requests', methods=['GET'])
def get_legacy_requests():
    """Get all legacy document requests for current institute"""
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Show only documents created by this institute
        requests = LegacyDocument.query.filter_by(institute_id=institute.id).order_by(LegacyDocument.created_at.desc()).all()
        
        return jsonify({
            'requests': [req.to_dict() for req in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/requests/<int:request_id>/fraud-analysis', methods=['PUT'])
def update_fraud_analysis(request_id):
    """Update fraud analysis for a legacy document"""
    try:
        data = request.get_json()
        
        # Get the document
        document = LegacyDocument.query.get(request_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Update fraud analysis fields
        document.fraud_risk = data.get('fraud_risk')
        document.fraud_score = data.get('fraud_score')
        document.fraud_analysis = data.get('fraud_analysis')
        document.requires_manual_review = data.get('requires_manual_review', False)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Fraud analysis updated successfully',
            'fraud_risk': document.fraud_risk,
            'fraud_score': document.fraud_score
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/requests/<int:request_id>', methods=['DELETE'])
def delete_legacy_document(request_id):
    """Delete a legacy document request"""
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get the document
        document = LegacyDocument.query.filter_by(id=request_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Delete the file if it exists
        if document.file_path and os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except Exception as e:
                print(f"Warning: Could not delete file {document.file_path}: {e}")
        
        # Delete the document from database
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/requests/<int:request_id>/status', methods=['PUT'])
def update_legacy_status(request_id):
    """Update legacy document status (unverified/pending/verified)"""
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['unverified', 'verified']:
            return jsonify({'error': 'Invalid status. Must be unverified or verified'}), 400
        
        request_id = request.view_args['request_id']
        legacy_doc = LegacyDocument.query.filter_by(id=request_id).first()
        
        if not legacy_doc:
            return jsonify({'error': 'Legacy document request not found'}), 404
        
        legacy_doc.status = new_status
        
        # If verifying, generate blockchain hash and QR code
        if new_status == 'verified':
            # Generate certificate ID
            cert_id = f"LEGACY_{legacy_doc.id}_{uuid.uuid4().hex[:8].upper()}"
            legacy_doc.cert_id = cert_id
            
            # Generate blockchain hash
            doc_data = {
                'legacy_doc_id': legacy_doc.id,
                'institute_id': institute.id,
                'doc_type': legacy_doc.doc_type,
                'student_name': legacy_doc.student_name,
                'student_roll': legacy_doc.student_roll,
                'uin': legacy_doc.uin,
                'date_issued': legacy_doc.date_issued.isoformat(),
                'institute_name': institute.name,
                'cert_id': cert_id,
                'marks': legacy_doc.marks,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            blockchain_hash = generate_blockchain_hash(doc_data)
            legacy_doc.blockchain_hash = blockchain_hash
            legacy_doc.verified_at = datetime.utcnow()
            legacy_doc.verified_by = institute.name
            
            # Add to ledger
            add_to_ledger(legacy_doc.id, blockchain_hash, doc_data)
            
            # Generate QR code and update PDF
            qr_data = {
                'legacy_doc_id': legacy_doc.id,
                'hash': blockchain_hash,
                'type': legacy_doc.doc_type,
                'institute': institute.name,
                'cert_id': cert_id,
                'student_roll': legacy_doc.student_roll,
                'student_name': legacy_doc.student_name,
                'uin': legacy_doc.uin
            }
            
            # Create processed file with QR code
            processed_filename = f"legacy_verified_{legacy_doc.id}.pdf"
            processed_path = os.path.join(current_app.config['CERT_OUTPUT_DIR'], processed_filename)
            
            watermark_text = f"Verified by {institute.name}"
            header_left = f"Certificate ID: {cert_id}"
            header_right = f"Issue Date: {legacy_doc.date_issued.strftime('%Y-%m-%d')}"
            
            add_watermark_and_qr(legacy_doc.file_path, processed_path, watermark_text, qr_data, 
                               header_left=header_left, header_right=header_right)
            
            # Update file path to processed version
            legacy_doc.file_path = processed_path
        
        db.session.commit()
        
        return jsonify({
            'message': f'Legacy document status updated to {new_status}',
            'request': legacy_doc.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/search', methods=['GET'])
def search_legacy_document():
    """Search for legacy document by UIN"""
    try:
        uin = request.args.get('uin')
        if not uin:
            return jsonify({'error': 'UIN is required'}), 400
        
        legacy_doc = LegacyDocument.query.filter_by(uin=uin).first()
        
        if not legacy_doc:
            return jsonify({'error': 'Legacy document not found'}), 404
        
        return jsonify({
            'documents': [legacy_doc.to_dict()],
            'count': 1
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/download/<int:request_id>', methods=['GET'])
def download_legacy_document(request_id):
    """Download legacy document (only verified documents)"""
    try:
        legacy_doc = LegacyDocument.query.get(request_id)
        if not legacy_doc:
            return jsonify({'error': 'Document not found'}), 404
        
        # Only allow download of verified documents
        if legacy_doc.status != 'verified':
            return jsonify({'error': 'Document must be verified before download'}), 403
        
        if not os.path.exists(legacy_doc.file_path):
            return jsonify({'error': 'File not found'}), 404
        
        from flask import send_file
        return send_file(legacy_doc.file_path, as_attachment=True, 
                        download_name=f"legacy_{legacy_doc.student_roll}_{legacy_doc.doc_type}.pdf")
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/view/<int:request_id>', methods=['GET'])
def view_legacy_document(request_id):
    """View legacy document"""
    try:
        legacy_doc = LegacyDocument.query.get(request_id)
        if not legacy_doc:
            return jsonify({'error': 'Document not found'}), 404
        
        if not os.path.exists(legacy_doc.file_path):
            return jsonify({'error': 'File not found'}), 404
        
        from flask import send_file
        return send_file(legacy_doc.file_path, as_attachment=False)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legacy_documents_bp.route('/legacy/institutes', methods=['GET'])
def get_institutes_for_legacy():
    """Get list of institutes for legacy document requests"""
    try:
        institutes = Institute.query.all()
        return jsonify({
            'institutes': [{'id': inst.id, 'name': inst.name} for inst in institutes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
