import { ExtractedData, ParsedData } from './ocrService';

export interface FraudAnalysis {
  fraud_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_score: number;
  detected_issues: string[];
  recommendations: string[];
  analysis_details?: {
    structure?: any;
    content?: any;
    forensics?: any;
    ml_classification?: any;
  };
  timestamp?: string;
  log_id?: number;
}

export interface FraudReport {
  document_id: number;
  fraud_type: string;
  description: string;
  reported_by?: string;
}

export interface FraudStatistics {
  total_analyses: number;
  high_risk_documents: number;
  medium_risk_documents: number;
  low_risk_documents: number;
  common_issues: Array<{ issue: string; count: number }>;
  detection_accuracy: number;
}

class FraudDetectionService {
  private baseUrl = 'http://localhost:5000/api';

  /**
   * Detect fraud in uploaded document
   */
  async detectFraud(file: File, extractedData: ParsedData): Promise<FraudAnalysis> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extracted_data', JSON.stringify(extractedData));

      const response = await fetch(`${this.baseUrl}/fraud/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fraud detection failed');
      }

      const data = await response.json();
      return data.fraud_analysis;
    } catch (error) {
      console.error('Fraud detection error:', error);
      throw error;
    }
  }

  /**
   * Validate existing document for fraud
   */
  async validateDocument(documentId: number): Promise<FraudAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/validate/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Document validation failed');
      }

      const data = await response.json();
      return data.fraud_analysis;
    } catch (error) {
      console.error('Document validation error:', error);
      throw error;
    }
  }

  /**
   * Report fraudulent document
   */
  async reportFraud(fraudReport: FraudReport): Promise<{ success: boolean; log_id: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fraudReport),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fraud reporting failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fraud reporting error:', error);
      throw error;
    }
  }

  /**
   * Get detailed fraud analysis by log ID
   */
  async getFraudAnalysis(logId: number): Promise<FraudAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/analysis/${logId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get fraud analysis');
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Get fraud analysis error:', error);
      throw error;
    }
  }

  /**
   * Get fraud detection statistics
   */
  async getFraudStatistics(): Promise<FraudStatistics> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/statistics`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get fraud statistics');
      }

      const data = await response.json();
      return data.statistics;
    } catch (error) {
      console.error('Get fraud statistics error:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple documents
   */
  async batchAnalyzeDocuments(documentIds: number[]): Promise<Array<{
    document_id: number;
    success: boolean;
    fraud_analysis?: FraudAnalysis;
    error?: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/batch-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_ids: documentIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch analysis failed');
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Batch analysis error:', error);
      throw error;
    }
  }

  /**
   * Health check for fraud detection service
   */
  async healthCheck(): Promise<{ success: boolean; status: string; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/fraud/health`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Health check failed');
      }

      const data = await response.json();
      return {
        success: data.success,
        status: data.status,
        version: data.version
      };
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Get risk level color for UI
   */
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'LOW':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  }

  /**
   * Get risk level icon
   */
  getRiskLevelIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return 'AlertTriangle';
      case 'MEDIUM':
        return 'Clock';
      case 'LOW':
        return 'CheckCircle';
      default:
        return 'Shield';
    }
  }

  /**
   * Format fraud probability for display
   */
  formatFraudProbability(probability: number): string {
    return `${(probability * 100).toFixed(1)}%`;
  }

  /**
   * Format confidence score for display
   */
  formatConfidenceScore(score: number): string {
    return `${(score * 100).toFixed(1)}%`;
  }

  /**
   * Check if document requires manual review
   */
  requiresManualReview(riskLevel: string): boolean {
    return riskLevel === 'HIGH' || riskLevel === 'MEDIUM';
  }

  /**
   * Get fraud type options for reporting
   */
  getFraudTypeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'forged_document', label: 'Forged Document' },
      { value: 'tampered_image', label: 'Tampered Image' },
      { value: 'fake_institution', label: 'Fake Institution' },
      { value: 'manipulated_data', label: 'Manipulated Data' },
      { value: 'stolen_identity', label: 'Stolen Identity' },
      { value: 'duplicate_document', label: 'Duplicate Document' },
      { value: 'other', label: 'Other' }
    ];
  }
}

export default new FraudDetectionService();
