from database import db
from datetime import datetime

class LegacyDocument(db.Model):
    __tablename__ = 'legacy_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    institute_id = db.Column(db.Integer, db.ForeignKey('institutes.id'), nullable=False)
    student_name = db.Column(db.String(255), nullable=False)
    student_roll = db.Column(db.String(100), nullable=False)
    doc_type = db.Column(db.String(50), nullable=False)  # "certificate" | "marksheet" | "document"
    marks = db.Column(db.Float, nullable=True)  # Only for marksheets
    uin = db.Column(db.String(100), nullable=False)
    date_issued = db.Column(db.Date, nullable=False)
    institute_name = db.Column(db.String(255), nullable=False)  # Institute that issued the original document
    file_path = db.Column(db.String(500), nullable=True)  # Path to uploaded PDF
    status = db.Column(db.String(50), default='unverified')  # "unverified" | "pending" | "verified"
    blockchain_hash = db.Column(db.String(255), nullable=True)  # Only set when verified
    cert_id = db.Column(db.String(100), nullable=True)  # Only set when verified
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by = db.Column(db.String(255), nullable=True)  # Institute name that verified
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'institute_id': self.institute_id,
            'student_name': self.student_name,
            'student_roll': self.student_roll,
            'doc_type': self.doc_type,
            'marks': self.marks,
            'uin': self.uin,
            'date_issued': self.date_issued.isoformat() if self.date_issued else None,
            'institute_name': self.institute_name,
            'file_path': self.file_path,
            'status': self.status,
            'blockchain_hash': self.blockchain_hash,
            'cert_id': self.cert_id,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by': self.verified_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
