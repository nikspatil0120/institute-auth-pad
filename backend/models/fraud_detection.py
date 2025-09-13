from database import db
from datetime import datetime

class FraudDetectionLog(db.Model):
    __tablename__ = 'fraud_detection_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('legacy_documents.id'), nullable=True)
    fraud_score = db.Column(db.Float, nullable=False)  # 0.0 to 1.0
    risk_level = db.Column(db.String(20), nullable=False)  # "LOW" | "MEDIUM" | "HIGH"
    confidence_score = db.Column(db.Float, nullable=False)  # 0.0 to 1.0
    detected_issues = db.Column(db.Text, nullable=False)  # JSON string of issues
    analysis_details = db.Column(db.Text, nullable=False)  # JSON string of detailed analysis
    recommendations = db.Column(db.Text, nullable=False)  # JSON string of recommendations
    analysis_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'fraud_score': self.fraud_score,
            'risk_level': self.risk_level,
            'confidence_score': self.confidence_score,
            'detected_issues': self.detected_issues,
            'analysis_details': self.analysis_details,
            'recommendations': self.recommendations,
            'analysis_timestamp': self.analysis_timestamp.isoformat()
        }
