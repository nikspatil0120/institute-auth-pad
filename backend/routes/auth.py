from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models.institute import Institute
from models.document import Document
from database import db
import jwt
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)

# Admin credentials (in production, these should be stored securely)
ADMIN_USERID = os.getenv('ADMIN_USERID', 'admin123')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'adminpass123')

@auth_bp.route('/institutes', methods=['GET'])
def list_institutes():
    """Public: List registered institutes for student login dropdown"""
    try:
        institutes = Institute.query.order_by(Institute.name.asc()).all()
        return jsonify({
            'institutes': [
                {'id': inst.id, 'name': inst.name}
                for inst in institutes
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if institute already exists
        if Institute.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Institute already exists'}), 400
        
        # Create new institute
        institute = Institute(
            name=data['name'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )
        
        db.session.add(institute)
        db.session.commit()
        
        return jsonify({
            'message': 'Institute registered successfully',
            'institute': institute.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        institute = Institute.query.filter_by(email=data['email']).first()
        
        if not institute or not check_password_hash(institute.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'institute_id': institute.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'institute': institute.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['institute_id']
    except:
        return None

def verify_admin_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('admin_id')
    except:
        return None

# Admin authentication endpoints
@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        
        if not data.get('userid') or not data.get('password'):
            return jsonify({'error': 'User ID and password required'}), 400
        
        # Check admin credentials
        if data['userid'] != ADMIN_USERID or data['password'] != ADMIN_PASSWORD:
            return jsonify({'error': 'Invalid admin credentials'}), 401
        
        # Generate JWT token for admin
        token = jwt.encode({
            'admin_id': 'admin',
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Admin login successful',
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/admin/institutes', methods=['GET'])
def admin_get_institutes():
    """Admin: Get all institutes with document and student counts"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not verify_admin_token(token):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        institutes = Institute.query.all()
        institutes_data = []
        
        for institute in institutes:
            # Count documents for this institute
            doc_count = Document.query.filter_by(institute_id=institute.id).count()
            
            # Count unique students by looking at ledger entries for this institute
            student_count = 0
            try:
                from blockchain.ledger import load_ledger
                ledger = load_ledger()
                student_rolls = set()
                for entry in ledger:
                    if entry.get('institute_id') == institute.id:
                        student_roll = entry.get('data', {}).get('student_roll')
                        if student_roll:
                            student_rolls.add(student_roll)
                student_count = len(student_rolls)
            except:
                # If ledger loading fails, set to 0
                student_count = 0
            
            institutes_data.append({
                'id': institute.id,
                'name': institute.name,
                'email': institute.email,
                'created_at': institute.created_at.isoformat(),
                'document_count': doc_count,
                'student_count': student_count
            })
        
        return jsonify({'institutes': institutes_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/admin/register-institute', methods=['POST'])
def admin_register_institute():
    """Admin: Register a new institute"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not verify_admin_token(token):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if institute already exists
        if Institute.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Institute already exists'}), 400
        
        # Create new institute
        institute = Institute(
            name=data['name'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )
        
        db.session.add(institute)
        db.session.commit()
        
        return jsonify({
            'message': 'Institute registered successfully',
            'institute': institute.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/admin/remove-institute/<int:institute_id>', methods=['DELETE'])
def admin_remove_institute(institute_id):
    """Admin: Remove an institute and all related data"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not verify_admin_token(token):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        # Find the institute
        institute = Institute.query.get(institute_id)
        if not institute:
            return jsonify({'error': 'Institute not found'}), 404
        
        # Get institute name for response
        institute_name = institute.name
        
        # Delete all documents for this institute
        Document.query.filter_by(institute_id=institute_id).delete()
        
        # Remove institute entries from ledger
        try:
            from blockchain.ledger import load_ledger, save_ledger
            ledger = load_ledger()
            # Filter out entries for this institute
            ledger = [entry for entry in ledger if entry.get('institute_id') != institute_id]
            save_ledger(ledger)
        except Exception as e:
            # Log the error but don't fail the deletion
            print(f"Warning: Could not update ledger: {e}")
        
        # Delete the institute
        db.session.delete(institute)
        db.session.commit()
        
        return jsonify({
            'message': f'Institute "{institute_name}" and all related data removed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
