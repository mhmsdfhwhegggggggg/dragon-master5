/**
 * Anti-Ban ML Engine - Basic machine learning for ban detection
 * Provides pattern recognition and risk assessment
 */

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: string[];
  recommendations: string[];
}

export interface OperationPattern {
  type: string;
  frequency: number;
  timing: number[];
  successRate: number;
  averageDelay: number;
}

export class AntiBanMLEngine {
  private static instance: AntiBanMLEngine;
  private patterns: Map<number, OperationPattern[]> = new Map();

  private constructor() {}

  static getInstance(): AntiBanMLEngine {
    if (!this.instance) {
      this.instance = new AntiBanMLEngine();
    }
    return this.instance;
  }

  /**
   * Analyze operation patterns and assess risk
   */
  analyzeRisk(accountId: number, recentOperations: any[]): RiskAssessment {
    const patterns = this.extractPatterns(recentOperations);
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Analyze frequency
    const highFrequency = patterns.some(p => p.frequency > 50);
    if (highFrequency) {
      riskFactors.push('HIGH_OPERATION_FREQUENCY');
      riskScore += 30;
    }

    // Analyze success rate
    const lowSuccessRate = patterns.some(p => p.successRate < 70);
    if (lowSuccessRate) {
      riskFactors.push('LOW_SUCCESS_RATE');
      riskScore += 25;
    }

    // Analyze timing patterns
    const irregularTiming = patterns.some(p => this.isIrregularTiming(p.timing));
    if (irregularTiming) {
      riskFactors.push('IRREGULAR_TIMING');
      riskScore += 20;
    }

    // Analyze operation diversity
    const limitedDiversity = patterns.length < 3;
    if (limitedDiversity) {
      riskFactors.push('LIMITED_OPERATION_DIVERSITY');
      riskScore += 15;
    }

    // Determine risk level
    let riskLevel: RiskAssessment['riskLevel'];
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    const recommendations = this.generateRecommendations(riskLevel, riskFactors);

    return {
      riskLevel,
      riskScore,
      factors: riskFactors,
      recommendations
    };
  }
}

// Export alias for compatibility
export const AntiBanEngine = AntiBanMLEngine;
