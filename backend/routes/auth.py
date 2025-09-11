from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.institute import Institute
from database import db
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

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
        }, 'your-secret-key', algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'institute': institute.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def verify_token(token):
    try:
        payload = jwt.decode(token, 'your-secret-key', algorithms=['HS256'])
        return payload['institute_id']
    except:
        return None
