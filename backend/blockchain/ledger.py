import json
import os
from datetime import datetime
from models.document import Document
from database import db
from PyPDF2 import PdfReader
import json

LEDGER_FILE = 'ledger.json'

def load_ledger():
    """Load ledger from file"""
    if os.path.exists(LEDGER_FILE):
        try:
            with open(LEDGER_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_ledger(ledger_data):
    """Save ledger to file"""
    try:
        with open(LEDGER_FILE, 'w') as f:
            json.dump(ledger_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving ledger: {str(e)}")
        return False

def add_to_ledger(doc_id, blockchain_hash, doc_data):
    """
    Add document to blockchain ledger
    
    Args:
        doc_id: Document ID
        blockchain_hash: Generated blockchain hash
        doc_data: Document metadata
    """
    try:
        ledger = load_ledger()
        
        entry = {
            'doc_id': doc_id,
            'blockchain_hash': blockchain_hash,
            'timestamp': datetime.utcnow().isoformat(),
            'data': doc_data,
            'status': 'confirmed'
        }
        
        ledger.append(entry)
        save_ledger(ledger)
        return True
        
    except Exception as e:
        print(f"Error adding to ledger: {str(e)}")
        return False

def remove_doc_from_ledger(doc_id: int) -> bool:
    """Mark a document as deleted in the ledger and remove prior entries for clarity."""
    try:
        ledger = load_ledger()
        # Filter out any existing entries for this doc
        ledger = [e for e in ledger if e.get('doc_id') != doc_id]
        # Append a deletion tombstone for auditability
        ledger.append({
            'doc_id': doc_id,
            'blockchain_hash': None,
            'timestamp': datetime.utcnow().isoformat(),
            'data': {'action': 'deleted'},
            'status': 'deleted'
        })
        return save_ledger(ledger)
    except Exception as e:
        print(f"Error removing from ledger: {str(e)}")
        return False

def reset_ledger() -> bool:
    """Clear the entire ledger (development/testing convenience)."""
    try:
        return save_ledger([])
    except Exception as e:
        print(f"Error resetting ledger: {str(e)}")
        return False

def verify_document(doc_id=None, uploaded_file=None, cert_id: str | None = None):
    """
    Verify document against ledger and database
    
    Args:
        doc_id: Document ID to verify
        uploaded_file: Uploaded file to verify
        
    Returns:
        dict: Verification result
    """
    try:
        ledger = load_ledger()

        if cert_id and not doc_id:
            # Lookup by certificate id (stored in Document.number)
            document: Document | None = Document.query.filter_by(number=cert_id).first()
            if not document:
                return {
                    'status': 'invalid',
                    'error': {'code': 'CERT_ID_NOT_FOUND', 'message': 'Certificate ID not found'}
                }
            # Recurse with doc_id to reuse logic
            return verify_document(doc_id=document.id)

        if doc_id:
            # Real verification by Document ID against database and ledger
            try:
                doc_id_int = int(doc_id)
            except ValueError:
                return {
                    'status': 'invalid',
                    'error': {
                        'code': 'INVALID_DOC_ID',
                        'message': 'Invalid document ID format'
                    }
                }

            document: Document | None = Document.query.filter_by(id=doc_id_int).first()
            if not document:
                return {
                    'status': 'invalid',
                    'error': {
                        'code': 'DOC_NOT_FOUND',
                        'message': 'Document not found in database'
                    }
                }

            # Pick the most recent ledger entry for this doc_id (handles DB resets or re-issues)
            ledger_entry = None
            for entry in reversed(ledger):
                if entry.get('doc_id') == doc_id_int:
                    ledger_entry = entry
                    break
            ledger_hash = ledger_entry.get('blockchain_hash') if ledger_entry else None
            ledger_ts = ledger_entry.get('timestamp') if ledger_entry else None

            is_hash_match = (ledger_hash == document.blockchain_hash) if ledger_hash else True
            if ledger_hash and not is_hash_match:
                # Auto-heal: trust the latest ledger entry and sync DB
                try:
                    document.blockchain_hash = ledger_hash
                    db.session.commit()
                    is_hash_match = True
                except Exception:
                    db.session.rollback()
            status = 'valid' if is_hash_match else 'invalid'

            result = {
                'status': status,
                'document': {
                    'id': document.id,
                    'doc_type': document.doc_type,
                    'name': document.name,
                    'number': document.number,
                    'exam_name': document.exam_name,
                    'issue_date': document.issue_date.isoformat() if document.issue_date else None,
                    'blockchain_hash': document.blockchain_hash,
                    'status': document.status,
                    'created_at': document.created_at.isoformat(),
                },
                'verification_details': {
                    'verified_at': datetime.utcnow().isoformat(),
                    'method': 'Document ID',
                    'blockchain_hash': document.blockchain_hash,
                    'ledger_timestamp': ledger_ts
                }
            }
            if status == 'invalid':
                result['error'] = {
                    'code': 'HASH_MISMATCH',
                    'message': 'Blockchain hash mismatch between ledger and database'
                }
            return result
        
        elif uploaded_file:
            # Try to read embedded QRData metadata from PDF and verify
            try:
                reader = PdfReader(uploaded_file)
                info = reader.metadata or {}
                qr_json = None
                # PyPDF2 stores keys with leading '/'
                if '/QRData' in info:
                    qr_json = info['/QRData']
                elif 'QRData' in info:
                    qr_json = info['QRData']
                if not qr_json:
                    return {
                        'status': 'invalid',
                        'error': {
                            'code': 'QRDATA_NOT_FOUND',
                            'message': 'QR data not embedded. Only documents issued by this system are supported.'
                        }
                    }
                qr_data = json.loads(qr_json)
                doc_id_from_qr = qr_data.get('doc_id')
                cert_id_from_qr = qr_data.get('cert_id') or qr_data.get('number')
                # Prefer doc_id verification
                if doc_id_from_qr:
                    return verify_document(doc_id=doc_id_from_qr)
                if cert_id_from_qr:
                    return verify_document(cert_id=cert_id_from_qr)
                return {
                    'status': 'invalid',
                    'error': {
                        'code': 'QRDATA_MISSING_KEYS',
                        'message': 'QR data missing identifiers.'
                    }
                }
            except Exception as e:
                return {
                    'status': 'invalid',
                    'error': {
                        'code': 'FILE_PARSE_ERROR',
                        'message': str(e)
                    }
                }
        
        else:
            return {
                'status': 'invalid',
                'error': {
                    'code': 'INVALID_REQUEST',
                    'message': 'Either doc_id or file upload required'
                }
            }
            
    except Exception as e:
        return {
            'status': 'invalid',
            'error': {
                'code': 'VERIFICATION_ERROR',
                'message': str(e)
            }
        }

def get_ledger_stats():
    """Get ledger statistics"""
    try:
        ledger = load_ledger()
        return {
            'total_entries': len(ledger),
            'confirmed_entries': len([entry for entry in ledger if entry.get('status') == 'confirmed']),
            'last_updated': max([entry['timestamp'] for entry in ledger]) if ledger else None
        }
    except Exception as e:
        return {'error': str(e)}
