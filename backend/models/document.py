from database import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    institute_id = db.Column(db.Integer, db.ForeignKey('institutes.id'), nullable=False)
    doc_type = db.Column(db.String(50), nullable=False)  # "document" | "certificate" | "marksheet"
    name = db.Column(db.String(255), nullable=False)
    number = db.Column(db.String(100), nullable=True)
    exam_name = db.Column(db.String(255), nullable=True)
    issue_date = db.Column(db.Date, nullable=False)
    blockchain_hash = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='pending')  # "pending" | "confirmed" | "issued"
    file_path = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'institute_id': self.institute_id,
            'doc_type': self.doc_type,
            'name': self.name,
            'number': self.number,
            'exam_name': self.exam_name,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'blockchain_hash': self.blockchain_hash,
            'status': self.status,
            'file_path': self.file_path,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
