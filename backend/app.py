from flask import Flask, request, jsonify, send_file
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure persistent absolute paths regardless of CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'instance', 'institute_auth.db')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
CERT_DIR = os.path.join(BASE_DIR, 'certificates')

os.makedirs(os.path.join(BASE_DIR, 'instance'), exist_ok=True)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR
app.config['CERT_OUTPUT_DIR'] = CERT_DIR

# Create directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['CERT_OUTPUT_DIR'], exist_ok=True)

# Import database and initialize
from database import db
db.init_app(app)
migrate = Migrate(app, db)
CORS(app)

# Import models after db is initialized
from models.institute import Institute
from models.document import Document
from models.legacy_document import LegacyDocument

# Import routes
from routes.auth import auth_bp
from routes.documents import documents_bp
from routes.legacy_documents import legacy_documents_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(documents_bp, url_prefix='/api')
app.register_blueprint(legacy_documents_bp, url_prefix='/api')

@app.route('/')
def index():
    return jsonify({'message': 'Institute Auth API', 'version': '1.0.0'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
