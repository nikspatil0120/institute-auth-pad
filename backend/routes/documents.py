from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from models.document import Document
from models.institute import Institute
from database import db
from sqlalchemy import func
from utils.pdf_tools import add_watermark_and_qr, generate_blockchain_hash
from blockchain.ledger import add_to_ledger, verify_document, remove_doc_from_ledger, reset_ledger
from routes.auth import verify_token
import json

documents_bp = Blueprint('documents', __name__)

def get_current_institute():
    """Get current institute from JWT token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    institute_id = verify_token(token)
    if not institute_id:
        return None
    
    return Institute.query.get(institute_id)

@documents_bp.route('/upload_document', methods=['POST'])
def upload_document():
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Validate required fields
        if 'type' not in request.form or 'file' not in request.files:
            return jsonify({'error': 'Type and file are required'}), 400
        
        doc_type = request.form['type']
        if doc_type not in ['document', 'certificate', 'marksheet']:
            return jsonify({'error': 'Invalid document type'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Get form data based on document type
        name = request.form.get('name', '')
        number = request.form.get('number', '')
        exam_name = request.form.get('exam_name', '')
        issue_date_str = request.form.get('issue_date', '')
        student_roll = request.form.get('student_roll')
        student_name = request.form.get('student_name')
        unique_id = request.form.get('unique_id')
        grading_type = request.form.get('grading_type')
        marks = request.form.get('marks')
        # Auto-generate certificate id if not provided
        if not number:
            date_part = datetime.utcnow().strftime('%Y%m%d')
            safe_roll = (student_roll or 'GEN').replace(' ', '').upper()[:8]
            number = f"{safe_roll}-{date_part}-{int(datetime.utcnow().timestamp())%100000}"
        
        if not name or not issue_date_str:
            return jsonify({'error': 'Name and issue date are required'}), 400
        
        # Parse issue date
        try:
            issue_date = datetime.strptime(issue_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"temp_{datetime.now().timestamp()}_{filename}")
        file.save(temp_path)
        
        # Generate blockchain hash
        doc_data = {
            'institute_id': institute.id,
            'doc_type': doc_type,
            'name': name,
            'number': number,
            'exam_name': exam_name,
            'unique_id': unique_id,
            'grading_type': grading_type,
            'marks': marks,
            'issue_date': issue_date_str,
            'student_roll': student_roll,
            'student_name': student_name,
            'timestamp': datetime.utcnow().isoformat()
        }
        blockchain_hash = generate_blockchain_hash(doc_data)
        
        # For certificates without explicit IDs, deterministically generate a Certificate ID from primary attributes
        if doc_type == 'certificate':
            cert_fingerprint = {
                'institute_id': institute.id,
                'student_roll': student_roll or '',
                'student_name': (student_name or '').strip().lower(),
                'course_name': (name or '').strip().lower(),
                'issue_date': issue_date_str,
            }
            generated_cert_id = generate_blockchain_hash(cert_fingerprint)[:16] if generate_blockchain_hash(cert_fingerprint) else None
            if generated_cert_id:
                number = generated_cert_id  # store deterministic cert id in number
            # Enforce uniqueness by this deterministic id
            existing_cert = Document.query.filter(
                Document.institute_id == institute.id,
                Document.doc_type == 'certificate',
                func.lower(Document.number) == number.strip().lower()
            ).first() if number else None
            if existing_cert:
                return jsonify({'error': 'This certificate already exists (duplicate detected)'}), 409

        # Prevent duplicate issuance based on unique_id for documents/marksheets and use UIN as stored number
        if doc_type in ['document', 'marksheet']:
            if not unique_id:
                return jsonify({'error': 'Unique Identifying Number is required for this document type'}), 400
            normalized_uid = unique_id.strip()
            exists = Document.query.filter(
                Document.institute_id == institute.id,
                Document.doc_type == doc_type,
                func.lower(Document.number) == normalized_uid.lower()
            ).first()
            if exists:
                return jsonify({'error': 'A document with this Unique Identifying Number already exists'}), 409
            number = normalized_uid

        # Create document record
        document = Document(
            institute_id=institute.id,
            doc_type=doc_type,
            name=name,
            number=number if number else None,
            exam_name=exam_name if exam_name else None,
            issue_date=issue_date,
            blockchain_hash=blockchain_hash,
            status='pending',
            file_path=''  # Will be updated after processing
        )
        
        db.session.add(document)
        db.session.commit()
        
        # Generate final file path - keep user-provided name prominent
        base_name = secure_filename(name) or f"document_{document.id}"
        final_filename = f"{base_name}_{document.id}.pdf"
        final_path = os.path.join(current_app.config['CERT_OUTPUT_DIR'], final_filename)
        
        # Prepare QR data
        qr_data = {
            'doc_id': document.id,
            'hash': blockchain_hash,
            'type': doc_type,
            'institute': institute.name,
            'cert_id': number,
            'student_roll': student_roll,
            'student_name': student_name
        }
        
        # Add watermark and QR code
        watermark_text = f"Verified by {institute.name}"
        # Prepare header strings
        header_left = f"Certificate ID: {number}" if number else None
        header_right = f"Issue Date: {issue_date.strftime('%Y-%m-%d')}"
        add_watermark_and_qr(temp_path, final_path, watermark_text, qr_data, header_left=header_left, header_right=header_right)
        
        # Update document with final file path
        document.file_path = final_path
        document.status = 'confirmed'
        db.session.commit()
        
        # Add to blockchain ledger
        add_to_ledger(document.id, blockchain_hash, doc_data)
        
        # Clean up temp file
        os.remove(temp_path)
        
        return jsonify({
            'doc_id': document.id,
            'type': doc_type,
            'hash': blockchain_hash,
            'download_url': f'/api/documents/download/{document.id}',
            'message': 'Document uploaded and processed successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/documents', methods=['GET'])
def get_documents():
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        
        documents = Document.query.filter_by(institute_id=institute.id).order_by(Document.created_at.desc()).all()
        
        docs = []
        for doc in documents:
            d = doc.to_dict()
            # Compute a deterministic certificate id for display for all doc types
            fingerprint = {
                'institute_id': doc.institute_id,
                'doc_type': doc.doc_type,
                'student_roll': None,
                'name': doc.name,
                'exam_name': doc.exam_name,
                'issue_date': d.get('issue_date')
            }
            try:
                # Best-effort: try to use ledger-like structure for stability
                cert_id_calc = generate_blockchain_hash(fingerprint)
                if cert_id_calc:
                    d['cert_id'] = cert_id_calc[:16]
            except Exception:
                d['cert_id'] = None
            docs.append(d)
        
        return jsonify({
            'documents': docs
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/documents/download/<int:doc_id>', methods=['GET'])
def download_document(doc_id):
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        
        document = Document.query.filter_by(id=doc_id, institute_id=institute.id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=f"{os.path.basename(document.file_path)}",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    try:
        institute = get_current_institute()
        if not institute:
            return jsonify({'error': 'Authentication required'}), 401
        document = Document.query.filter_by(id=doc_id, institute_id=institute.id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        # Remove file if exists
        try:
            if document.file_path and os.path.exists(document.file_path):
                os.remove(document.file_path)
        except Exception:
            pass
        db.session.delete(document)
        db.session.commit()
        # Update ledger tombstone for this doc
        remove_doc_from_ledger(doc_id)
        return jsonify({'message': 'Document deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/verify_document', methods=['POST'])
def verify_document_endpoint():
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            doc_id = data.get('doc_id') if data else None
            uploaded_file = None
        else:
            # Handle form data (for file uploads)
            doc_id = request.form.get('doc_id')
            # Support multiple common keys just in case
            uploaded_file = request.files.get('file') or request.files.get('pdf') or request.files.get('document')
        
        # Also support verification by certificate id when provided
        cert_id = None
        if request.is_json and data:
            cert_id = data.get('cert_id')
        else:
            cert_id = request.form.get('cert_id')

        if not doc_id and not uploaded_file and not cert_id:
            return jsonify({'error': 'Either doc_id, cert_id or file upload required'}), 400

        # Verify document
        result = verify_document(doc_id, uploaded_file, cert_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Verification error: {str(e)}")  # Debug logging
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/ledger/reset', methods=['POST'])
def reset_ledger_endpoint():
    try:
        # Dev-only endpoint to reset ledger (no auth to simplify local testing). Remove for production.
        reset_ledger()
        return jsonify({'message': 'Ledger reset successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
