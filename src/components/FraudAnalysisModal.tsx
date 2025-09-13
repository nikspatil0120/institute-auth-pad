import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  FileText, 
  Eye,
  BarChart3,
  Settings,
  AlertCircle
} from 'lucide-react';

interface FraudAnalysis {
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
}

interface FraudAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  fraudAnalysis: FraudAnalysis;
  onReportFraud?: () => void;
}

const FraudAnalysisModal: React.FC<FraudAnalysisModalProps> = ({
  isOpen,
  onClose,
  fraudAnalysis,
  onReportFraud
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'MEDIUM':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'LOW':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getRiskIcon(fraudAnalysis.risk_level)}
            Fraud Detection Analysis
            <Badge className={getRiskColor(fraudAnalysis.risk_level)}>
              {fraudAnalysis.risk_level} RISK
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Technical Details
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fraud Probability */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Fraud Probability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(1 - fraudAnalysis.fraud_probability)}`}>
                    {formatPercentage(fraudAnalysis.fraud_probability)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values indicate higher fraud risk
                  </p>
                </CardContent>
              </Card>

              {/* Confidence Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Confidence Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(fraudAnalysis.confidence_score)}`}>
                    {formatPercentage(fraudAnalysis.confidence_score)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analysis confidence level
                  </p>
                </CardContent>
              </Card>

              {/* Risk Level */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getRiskIcon(fraudAnalysis.risk_level)}
                    <span className="text-lg font-semibold">{fraudAnalysis.risk_level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Overall risk assessment
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    {fraudAnalysis.risk_level === 'HIGH' 
                      ? 'This document shows multiple indicators of potential fraud and requires immediate manual verification.'
                      : fraudAnalysis.risk_level === 'MEDIUM'
                      ? 'This document has some suspicious characteristics that warrant additional review.'
                      : 'This document appears to be authentic with minimal fraud indicators.'
                    }
                  </p>
                  {fraudAnalysis.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      Analysis completed: {new Date(fraudAnalysis.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onReportFraud && fraudAnalysis.risk_level === 'HIGH' && (
                <Button
                  variant="destructive"
                  onClick={onReportFraud}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report as Fraudulent
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Detected Issues ({fraudAnalysis.detected_issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fraudAnalysis.detected_issues.length > 0 ? (
                  <div className="space-y-3">
                    {fraudAnalysis.detected_issues.map((issue, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>No issues detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {fraudAnalysis.analysis_details && (
              <div className="space-y-4">
                {/* Structure Analysis */}
                {fraudAnalysis.analysis_details.structure && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Document Structure Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Structure Score:</span>
                          <span className={`text-sm font-medium ${getScoreColor(fraudAnalysis.analysis_details.structure.score || 0)}`}>
                            {formatPercentage(fraudAnalysis.analysis_details.structure.score || 0)}
                          </span>
                        </div>
                        {fraudAnalysis.analysis_details.structure.details && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Margins: {formatPercentage(fraudAnalysis.analysis_details.structure.details.margins?.score || 0)}</p>
                            <p>Text Density: {formatPercentage(fraudAnalysis.analysis_details.structure.details.text_density?.score || 0)}</p>
                            <p>Layout: {formatPercentage(fraudAnalysis.analysis_details.structure.details.layout?.score || 0)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Content Analysis */}
                {fraudAnalysis.analysis_details.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Content Pattern Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Content Score:</span>
                          <span className={`text-sm font-medium ${getScoreColor(fraudAnalysis.analysis_details.content.score || 0)}`}>
                            {formatPercentage(fraudAnalysis.analysis_details.content.score || 0)}
                          </span>
                        </div>
                        {fraudAnalysis.analysis_details.content.details && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Institution: {formatPercentage(fraudAnalysis.analysis_details.content.details.institution?.score || 0)}</p>
                            <p>Date: {formatPercentage(fraudAnalysis.analysis_details.content.details.date?.score || 0)}</p>
                            <p>Grade: {formatPercentage(fraudAnalysis.analysis_details.content.details.grade?.score || 0)}</p>
                            <p>Name: {formatPercentage(fraudAnalysis.analysis_details.content.details.name?.score || 0)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Forensics Analysis */}
                {fraudAnalysis.analysis_details.forensics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Image Forensics Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Forensics Score:</span>
                          <span className={`text-sm font-medium ${getScoreColor(fraudAnalysis.analysis_details.forensics.score || 0)}`}>
                            {formatPercentage(fraudAnalysis.analysis_details.forensics.score || 0)}
                          </span>
                        </div>
                        {fraudAnalysis.analysis_details.forensics.details && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Compression: {formatPercentage(fraudAnalysis.analysis_details.forensics.details.compression?.score || 0)}</p>
                            <p>Noise: {formatPercentage(fraudAnalysis.analysis_details.forensics.details.noise?.score || 0)}</p>
                            <p>Color: {formatPercentage(fraudAnalysis.analysis_details.forensics.details.color?.score || 0)}</p>
                            <p>Edges: {formatPercentage(fraudAnalysis.analysis_details.forensics.details.edges?.score || 0)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Recommendations ({fraudAnalysis.recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fraudAnalysis.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {fraudAnalysis.recommendations.map((recommendation, index) => (
                      <Alert key={index}>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{recommendation}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>No specific recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FraudAnalysisModal;
