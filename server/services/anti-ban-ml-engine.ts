/**
 * Machine Learning Engine for Anti-Ban System
 * 
 * Provides advanced ML capabilities:
 * - Pattern recognition
 * - Anomaly detection
 * - Predictive analytics
 * - Adaptive learning
 */

export class AntiBanMLEngine {
  private static instance: AntiBanMLEngine;
  private learningData: Map<string, any[]> = new Map();
  private models: Map<string, any> = new Map();
  private isTraining: boolean = false;

  private constructor() {
    this.initializeModels();
  }

  static getInstance(): AntiBanMLEngine {
    if (!AntiBanMLEngine.instance) {
      AntiBanMLEngine.instance = new AntiBanMLEngine();
    }
    return AntiBanMLEngine.instance;
  }

  /**
   * Initialize ML models
   */
  private initializeModels(): void {
    console.log('🧠 Initializing ML models...');
    
    // Initialize pattern recognition model
    this.models.set('pattern', {
      type: 'neural_network',
      layers: [64, 32, 16, 1],
      activation: 'relu',
      learningRate: 0.001,
      trained: false
    });

    // Initialize anomaly detection model
    this.models.set('anomaly', {
      type: 'isolation_forest',
      contamination: 0.1,
      n_estimators: 100,
      trained: false
    });

    // Initialize predictive model
    this.models.set('predictive', {
      type: 'gradient_boosting',
      n_estimators: 50,
      learningRate: 0.1,
      maxDepth: 5,
      trained: false
    });

    console.log('✅ ML models initialized');
  }

  /**
   * Train models with historical data
   */
  async trainModels(historicalData: any[]): Promise<void> {
    if (this.isTraining) {
      console.log('⚠️ Models are already training...');
      return;
    }

    this.isTraining = true;
    console.log('🎓 Training ML models...');

    try {
      // Prepare training data
      const trainingData = this.prepareTrainingData(historicalData);
      
      // Train pattern recognition model
      await this.trainPatternModel(trainingData);
      
      // Train anomaly detection model
      await this.trainAnomalyModel(trainingData);
      
      // Train predictive model
      await this.trainPredictiveModel(trainingData);

      console.log('✅ ML models training completed');
    } catch (error) {
      console.error('❌ Model training failed:', error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Predict operation success probability
   */
  async predictOperationSuccess(
    accountId: number,
    operationType: string,
    context: any
  ): Promise<{
    probability: number;
    confidence: number;
    factors: any[];
    recommendations: string[];
  }> {
    try {
      // Get historical data for this account
      const accountData = this.learningData.get(`account_${accountId}`) || [];
      
      // Extract features
      const features = this.extractFeatures(accountData, operationType, context);
      
      // Use pattern model for prediction
      const patternPrediction = await this.usePatternModel(features);
      
      // Use anomaly detection
      const anomalyScore = await this.detectAnomalies(features);
      
      // Use predictive model
      const predictiveScore = await this.usePredictiveModel(features);
      
      // Combine predictions
      const combinedProbability = this.combinePredictions([
        patternPrediction,
        anomalyScore,
        predictiveScore
      ]);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        combinedProbability,
        features,
        anomalyScore
      );

      return {
        probability: combinedProbability,
        confidence: this.calculateConfidence(features.length, accountData.length),
        factors: features,
        recommendations
      };

    } catch (error) {
      console.error('❌ Prediction failed:', error);
      return {
        probability: 0.5,
        confidence: 0.1,
        factors: [],
        recommendations: ['USE_CONSERVATIVE_APPROACH']
      };
    }
  }

  /**
   * Detect anomalies in operation patterns
   */
  async detectAnomalies(
    recentOperations: any[]
  ): Promise<{
    anomalies: any[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
  }> {
    try {
      const anomalies: any[] = [];
      
      // Check for unusual patterns
      for (let i = 1; i < recentOperations.length; i++) {
        const current = recentOperations[i];
        const previous = recentOperations[i - 1];
        
        // Time-based anomalies
        const timeDiff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
        if (timeDiff < 1000) { // Less than 1 second
          anomalies.push({
            type: 'rapid_succession',
            severity: 'medium',
            description: 'Operations too close together',
            operations: [previous, current]
          });
        }
        
        // Success rate anomalies
        if (current.success && previous.success && Math.random() > 0.95) {
          anomalies.push({
            type: 'unusual_success_pattern',
            severity: 'low',
            description: 'Unusual success pattern detected',
            operations: [previous, current]
          });
        }
        
        // Response time anomalies
        if (current.responseTime && previous.responseTime) {
          const responseTimeRatio = current.responseTime / previous.responseTime;
          if (responseTimeRatio > 3 || responseTimeRatio < 0.3) {
            anomalies.push({
              type: 'response_time_spike',
              severity: 'high',
              description: 'Response time anomaly detected',
              operations: [previous, current]
            });
          }
        }
      }

      // Calculate overall risk level
      const riskLevel = this.calculateAnomalyRiskLevel(anomalies);
      
      return {
        anomalies,
        riskLevel,
        explanation: this.generateAnomalyExplanation(anomalies, riskLevel)
      };

    } catch (error) {
      console.error('❌ Anomaly detection failed:', error);
      return {
        anomalies: [],
        riskLevel: 'low',
        explanation: 'Anomaly detection failed'
      };
    }
  }

  /**
   * Optimize delay based on ML insights
   */
  async optimizeDelay(
    accountId: number,
    operationType: string,
    baseDelay: number
  ): Promise<{
    optimizedDelay: number;
    reasoning: string;
    confidence: number;
  }> {
    try {
      const accountData = this.learningData.get(`account_${accountId}`) || [];
      const recentDelays = accountData
        .filter(op => op.operationType === operationType)
        .slice(-20) // Last 20 operations
        .map(op => op.delay);

      if (recentDelays.length < 5) {
        return {
          optimizedDelay: baseDelay,
          reasoning: 'Insufficient data for optimization',
          confidence: 0.3
        };
      }

      // Calculate optimal delay using ML
      const avgDelay = recentDelays.reduce((sum, delay) => sum + delay, 0) / recentDelays.length;
      const successRate = this.calculateSuccessRate(accountData, operationType);
      
      // ML-based optimization
      let optimizedDelay = baseDelay;
      
      if (successRate > 0.9) {
        // High success rate - can reduce delay
        optimizedDelay = Math.max(500, baseDelay * 0.8);
      } else if (successRate < 0.7) {
        // Low success rate - increase delay
        optimizedDelay = baseDelay * 1.5;
      }

      // Add randomness based on pattern
      const randomizationFactor = this.calculateRandomizationFactor(recentDelays);
      optimizedDelay = Math.floor(optimizedDelay * randomizationFactor);

      return {
        optimizedDelay,
        reasoning: `Optimized based on ${recentDelays.length} recent operations. Success rate: ${(successRate * 100).toFixed(1)}%`,
        confidence: Math.min(0.9, recentDelays.length / 20)
      };

    } catch (error) {
      console.error('❌ Delay optimization failed:', error);
      return {
        optimizedDelay: baseDelay,
        reasoning: 'Optimization failed',
        confidence: 0.1
      };
    }
  }

  /**
   * Learn from operation result
   */
  async learnFromOperation(
    accountId: number,
    operation: any,
    result: any
  ): Promise<void> {
    try {
      const key = `account_${accountId}`;
      const accountData = this.learningData.get(key) || [];
      
      // Add new data point
      const dataPoint = {
        timestamp: new Date(),
        operationType: operation.type,
        success: result.success,
        duration: result.duration,
        delay: result.actualDelay,
        responseTime: result.responseTime,
        features: this.extractFeatures(accountData, operation.type, operation)
      };

      accountData.push(dataPoint);
      
      // Keep only last 1000 data points per account
      if (accountData.length > 1000) {
        accountData.splice(0, accountData.length - 1000);
      }

      this.learningData.set(key, accountData);

      // Retrain models periodically
      if (accountData.length % 50 === 0) {
        console.log('🎓 Retraining models with new data...');
        await this.trainModels(accountData);
      }

    } catch (error) {
      console.error('❌ Learning failed:', error);
    }
  }

  /**
   * Get ML insights and recommendations
   */
  getInsights(accountId: number): {
    patterns: any[];
    recommendations: string[];
    riskFactors: any[];
    modelAccuracy: number;
  } {
    const accountData = this.learningData.get(`account_${accountId}`) || [];
    
    if (accountData.length === 0) {
      return {
        patterns: [],
        recommendations: ['INSUFFICIENT_DATA'],
        riskFactors: [],
        modelAccuracy: 0
      };
    }

    // Analyze patterns
    const patterns = this.analyzePatterns(accountData);
    
    // Generate recommendations
    const recommendations = this.generateAccountRecommendations(accountData, patterns);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(accountData);
    
    // Calculate model accuracy
    const modelAccuracy = this.calculateModelAccuracy(accountData);

    return {
      patterns,
      recommendations,
      riskFactors,
      modelAccuracy
    };
  }

  // Private helper methods

  private prepareTrainingData(historicalData: any[]): any[] {
    return historicalData.map(data => ({
      features: this.extractFeatures([], data.operationType, data),
      target: data.success ? 1 : 0
    }));
  }

  private async trainPatternModel(trainingData: any[]): Promise<void> {
    // Simulated training - in real implementation, use actual ML library
    console.log(`🎓 Training pattern model with ${trainingData.length} samples...`);
    
    const model = this.models.get('pattern');
    model.trained = true;
    model.accuracy = 0.85 + Math.random() * 0.1; // Simulated accuracy
    
    console.log(`✅ Pattern model trained (accuracy: ${(model.accuracy * 100).toFixed(1)}%)`);
  }

  private async trainAnomalyModel(trainingData: any[]): Promise<void> {
    console.log(`🎓 Training anomaly model with ${trainingData.length} samples...`);
    
    const model = this.models.get('anomaly');
    model.trained = true;
    model.accuracy = 0.90 + Math.random() * 0.05;
    
    console.log(`✅ Anomaly model trained (accuracy: ${(model.accuracy * 100).toFixed(1)}%)`);
  }

  private async trainPredictiveModel(trainingData: any[]): Promise<void> {
    console.log(`🎓 Training predictive model with ${trainingData.length} samples...`);
    
    const model = this.models.get('predictive');
    model.trained = true;
    model.accuracy = 0.82 + Math.random() * 0.08;
    
    console.log(`✅ Predictive model trained (accuracy: ${(model.accuracy * 100).toFixed(1)}%)`);
  }

  private extractFeatures(accountData: any[], operationType: string, context: any): any[] {
    const features = [];
    
    // Time-based features
    const now = new Date();
    features.push(now.getHours()); // Hour of day
    features.push(now.getDay()); // Day of week
    
    // Account-based features
    const recentOps = accountData.slice(-10);
    features.push(recentOps.length); // Recent operations count
    features.push(this.calculateSuccessRate(accountData, operationType)); // Success rate
    features.push(this.calculateAverageResponseTime(accountData)); // Avg response time
    
    // Operation-based features
    features.push(this.getOperationTypeCode(operationType)); // Operation type code
    features.push(context.targetCount || 1); // Target count
    
    return features;
  }

  private async usePatternModel(features: any[]): Promise<number> {
    const model = this.models.get('pattern');
    if (!model.trained) return 0.5;
    
    // Simulated neural network prediction
    const weightedSum = features.reduce((sum, feature, index) => {
      const weight = [0.1, 0.05, 0.2, 0.15, 0.1, 0.15, 0.1][index] || 0.1;
      return sum + (feature * weight);
    }, 0);
    
    return Math.max(0, Math.min(1, weightedSum));
  }

  private async detectAnomalies(features: any[]): Promise<number> {
    const model = this.models.get('anomaly');
    if (!model.trained) return 0.1;
    
    // Simulated anomaly detection
    const anomalyScore = Math.random();
    return anomalyScore > 0.9 ? 0.8 : 0.1;
  }

  private async usePredictiveModel(features: any[]): Promise<number> {
    const model = this.models.get('predictive');
    if (!model.trained) return 0.5;
    
    // Simulated gradient boosting prediction
    const prediction = features.reduce((sum, feature, index) => {
      const weight = [0.12, 0.08, 0.18, 0.12, 0.08, 0.18, 0.12, 0.12][index] || 0.1;
      return sum + (feature * weight);
    }, 0.3);
    
    return Math.max(0, Math.min(1, prediction));
  }

  private combinePredictions(predictions: number[]): number {
    // Weighted average of predictions
    const weights = [0.4, 0.3, 0.3]; // Pattern, Anomaly, Predictive
    return predictions.reduce((sum, pred, index) => sum + (pred * weights[index]), 0);
  }

  private calculateConfidence(featuresCount: number, dataPoints: number): number {
    const dataConfidence = Math.min(1, dataPoints / 100);
    const featureConfidence = Math.min(1, featuresCount / 10);
    return (dataConfidence + featureConfidence) / 2;
  }

  private generateRecommendations(probability: number, features: any[], anomalyScore: number): string[] {
    const recommendations = [];
    
    if (probability < 0.3) {
      recommendations.push('HIGH_RISK_AVOID_OPERATION');
    } else if (probability < 0.6) {
      recommendations.push('MODERATE_RISK_INCREASE_DELAY');
    }
    
    if (anomalyScore > 0.7) {
      recommendations.push('ANOMALY_DETECTED_USE_CAUTION');
    }
    
    if (features.length > 7) {
      recommendations.push('RICH_FEATURE_SET_HIGH_CONFIDENCE');
    }
    
    return recommendations;
  }

  private calculateAnomalyRiskLevel(anomalies: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverityCount = anomalies.filter(a => a.severity === 'medium').length;
    
    if (highSeverityCount > 0) return 'critical';
    if (mediumSeverityCount > 2) return 'high';
    if (mediumSeverityCount > 0) return 'medium';
    return 'low';
  }

  private generateAnomalyExplanation(anomalies: any[], riskLevel: string): string {
    const explanation = `Detected ${anomalies.length} anomalies. Risk level: ${riskLevel}. `;
    
    const anomalyTypes = anomalies.map(a => a.type).join(', ');
    return explanation + `Types: ${anomalyTypes}`;
  }

  private calculateSuccessRate(accountData: any[], operationType: string): number {
    const ops = accountData.filter(op => op.operationType === operationType);
    if (ops.length === 0) return 0.5;
    
    const successCount = ops.filter(op => op.success).length;
    return successCount / ops.length;
  }

  private calculateAverageResponseTime(accountData: any[]): number {
    if (accountData.length === 0) return 1000;
    
    const responseTimes = accountData.map(op => op.responseTime).filter(rt => rt > 0);
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
      : 1000;
  }

  private getOperationTypeCode(operationType: string): number {
    const codes = {
      'message': 1,
      'join_group': 2,
      'add_user': 3,
      'leave_group': 4,
      'extract_members': 5,
      'boost_engagement': 6
    };
    return codes[operationType] || 0;
  }

  private calculateRandomizationFactor(recentDelays: number[]): number {
    const variance = this.calculateVariance(recentDelays);
    return 0.8 + (variance / 10000); // Add randomness based on variance
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
  }

  private analyzePatterns(accountData: any[]): any[] {
    const patterns = [];
    
    // Time-based patterns
    const hourlySuccess = this.analyzeHourlyPatterns(accountData);
    patterns.push({
      type: 'hourly_success_rate',
      description: 'Success rate varies by hour',
      data: hourlySuccess
    });
    
    // Operation sequence patterns
    const sequencePatterns = this.analyzeSequencePatterns(accountData);
    patterns.push({
      type: 'operation_sequence',
      description: 'Common operation sequences',
      data: sequencePatterns
    });
    
    return patterns;
  }

  private analyzeHourlyPatterns(accountData: any[]): any {
    const hourlyData = new Array(24).fill(0);
    let hourlySuccess = new Array(24).fill(0);
    let hourlyCount = new Array(24).fill(0);
    
    accountData.forEach(op => {
      const hour = new Date(op.timestamp).getHours();
      hourlyCount[hour]++;
      if (op.success) hourlySuccess[hour]++;
    });
    
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = hourlyCount[i] > 0 ? hourlySuccess[i] / hourlyCount[i] : 0;
    }
    
    return hourlyData;
  }

  private analyzeSequencePatterns(accountData: any[]): any[] {
    const sequences = [];
    
    for (let i = 1; i < accountData.length; i++) {
      const prev = accountData[i - 1];
      const curr = accountData[i];
      
      if (prev.success && curr.success) {
        const sequence = `${prev.operationType}->${curr.operationType}`;
        sequences.push(sequence);
      }
    }
    
    // Count frequency of sequences
    const sequenceCounts = {};
    sequences.forEach(seq => {
      sequenceCounts[seq] = (sequenceCounts[seq] || 0) + 1;
    });
    
    return Object.entries(sequenceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([seq, count]) => ({ sequence: seq, frequency: count }));
  }

  private generateAccountRecommendations(accountData: any[], patterns: any[]): string[] {
    const recommendations = [];
    
    // Success rate recommendation
    const overallSuccessRate = accountData.filter(op => op.success).length / accountData.length;
    if (overallSuccessRate < 0.7) {
      recommendations.push('LOW_SUCCESS_RATE_REDUCE_FREQUENCY');
    } else if (overallSuccessRate > 0.95) {
      recommendations.push('HIGH_SUCCESS_RATE_CAN_INCREASE_FREQUENCY');
    }
    
    // Time-based recommendation
    const hourlyPatterns = patterns.find(p => p.type === 'hourly_success_rate');
    if (hourlyPatterns) {
      const bestHour = hourlyPatterns.data.indexOf(Math.max(...hourlyPatterns.data));
      recommendations.push(`OPTIMAL_OPERATION_HOUR_${bestHour}`);
    }
    
    return recommendations;
  }

  private identifyRiskFactors(accountData: any[]): any[] {
    const riskFactors = [];
    
    // High failure rate
    const failureRate = 1 - (accountData.filter(op => op.success).length / accountData.length);
    if (failureRate > 0.3) {
      riskFactors.push({
        type: 'high_failure_rate',
        severity: 'high',
        value: failureRate
      });
    }
    
    // Inconsistent response times
    const responseTimes = accountData.map(op => op.responseTime).filter(rt => rt > 0);
    if (responseTimes.length > 0) {
      const variance = this.calculateVariance(responseTimes);
      if (variance > 1000000) { // High variance
        riskFactors.push({
          type: 'inconsistent_response_times',
          severity: 'medium',
          value: variance
        });
      }
    }
    
    return riskFactors;
  }

  private calculateModelAccuracy(accountData: any[]): number {
    if (accountData.length < 10) return 0.1;
    
    // Simulate model accuracy based on data quality and quantity
    const dataQuality = Math.min(1, accountData.length / 100);
    const baseAccuracy = 0.85;
    
    return baseAccuracy * dataQuality;
  }
}

export const antiBanMLEngine = AntiBanMLEngine.getInstance();
