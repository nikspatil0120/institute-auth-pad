import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye,
  FileText,
  Clock
} from 'lucide-react';

interface FraudAnalysis {
  fraud_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_score: number;
  detected_issues: string[];
  recommendations: string[];
  analysis_details?: any;
  timestamp?: string;
}

interface FraudDetectionAlertProps {
  fraudAnalysis: FraudAnalysis;
  onViewDetails?: () => void;
  onReportFraud?: () => void;
  onClearAnalysis?: () => void;
  className?: string;
}

const FraudDetectionAlert: React.FC<FraudDetectionAlertProps> = ({
  fraudAnalysis,
  onViewDetails,
  onReportFraud,
  onClearAnalysis,
  className = ""
}) => {
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4" />;
      case 'LOW':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAlertVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatFraudProbability = (probability: number) => {
    return `${(probability * 100).toFixed(1)}%`;
  };

  const formatConfidenceScore = (score: number) => {
    return `${(score * 100).toFixed(1)}%`;
  };

  if (fraudAnalysis.risk_level === 'LOW') {
    return (
      <Alert className={`border-green-500/30 bg-green-500/10 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-400" />
        <AlertTitle className="text-green-400">Document Appears Authentic</AlertTitle>
        <AlertDescription className="text-green-300">
          <div className="space-y-2">
            <p>This document has passed fraud detection analysis with low risk indicators.</p>
            <div className="flex items-center gap-4 text-sm">
              <span>Fraud Probability: <strong>{formatFraudProbability(fraudAnalysis.fraud_probability)}</strong></span>
              <span>Confidence: <strong>{formatConfidenceScore(fraudAnalysis.confidence_score)}</strong></span>
            </div>
            <div className="flex gap-2 mt-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Analysis Details
                </Button>
              )}
              {onClearAnalysis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAnalysis}
                  className="border-gray-500/50 text-gray-400 hover:bg-gray-500/20"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Analysis
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Alert */}
      <Alert variant={getAlertVariant(fraudAnalysis.risk_level)}>
        {getRiskIcon(fraudAnalysis.risk_level)}
        <AlertTitle>
          {fraudAnalysis.risk_level === 'HIGH' ? 'High Fraud Risk Detected' : 'Medium Fraud Risk Detected'}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-3">
            <p>
              {fraudAnalysis.risk_level === 'HIGH' 
                ? 'This document shows signs of potential fraud and requires immediate attention.'
                : 'This document has some suspicious characteristics that warrant review.'
              }
            </p>
            
            {/* Risk Badge */}
            <div className="flex items-center gap-2">
              <Badge className={getRiskColor(fraudAnalysis.risk_level)}>
                {getRiskIcon(fraudAnalysis.risk_level)}
                <span className="ml-1">{fraudAnalysis.risk_level} RISK</span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                Fraud Probability: {formatFraudProbability(fraudAnalysis.fraud_probability)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
              {onReportFraud && fraudAnalysis.risk_level === 'HIGH' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onReportFraud}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Report Fraud
                </Button>
              )}
              {onClearAnalysis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAnalysis}
                  className="border-gray-500/50 text-gray-400 hover:bg-gray-500/20"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Analysis
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Issues Summary */}
      {fraudAnalysis.detected_issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detected Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {fraudAnalysis.detected_issues.slice(0, 3).map((issue, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  {issue}
                </li>
              ))}
              {fraudAnalysis.detected_issues.length > 3 && (
                <li className="text-sm text-muted-foreground">
                  +{fraudAnalysis.detected_issues.length - 3} more issues
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {fraudAnalysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {fraudAnalysis.recommendations.slice(0, 3).map((recommendation, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {recommendation}
                </li>
              ))}
              {fraudAnalysis.recommendations.length > 3 && (
                <li className="text-sm text-muted-foreground">
                  +{fraudAnalysis.recommendations.length - 3} more recommendations
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FraudDetectionAlert;
