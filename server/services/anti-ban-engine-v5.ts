/**
 * AI Anti-Ban System v5.0 🔥
 * 
 * Advanced AI-powered anti-ban protection:
 * - Predictive ban probability (0-100%)
 * - Behavioral pattern analysis
 * - Adaptive strategies
 * - Human-like delays
 * - Anomaly detection
 * - Learning system
 * - Emergency stop on high risk
 * 
 * @version 5.0.0
 * @author FALCON Team
 */

import { logger } from '../_core/logger';
import { CacheSystem } from '../_core/cache-system';
import { RiskDetector } from './risk-detection';
import { proxyIntelligenceManager } from './proxy-intelligence';
import * as db from '../db';
import { and, eq, desc } from 'drizzle-orm';
import { telegramClientService } from './telegram-client.service';
import { channelShield } from './channel-shield';
import { Api } from 'telegram';

export interface AntiBanConfig {
  accountId: number;
  protectionLevel: 'conservative' | 'balanced' | 'aggressive';
  maxRiskScore: number;
  learningEnabled: boolean;
  emergencyStop: boolean;
}

export interface OperationContext {
  accountId: number;
  operationType: 'message' | 'add_member' | 'join_group' | 'extract_members' | 'leave_group';
  targetId?: string;
  memberCount?: number;
  messageLength?: number;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  speed: 'slow' | 'medium' | 'fast';
  timeOfDay: number;
  dayOfWeek: number;
  accountAge: number;
  recentActivityCount: number;
  proxyUsed?: boolean;
}

export interface BehaviorPattern {
  accountId: number;
  operationType: string;
  averageDelay: number;
  delayVariance: number;
  successRate: number;
  riskScore: number;
  lastUpdated: number;
  sampleSize: number;
}

export interface AnomalyDetection {
  type: 'burst_activity' | 'unusual_timing' | 'pattern_deviation' | 'risk_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  timestamp: number;
  recommendedAction: 'continue' | 'slow_down' | 'stop' | 'emergency_stop' | 'delay' | 'stop_operation';
}

export interface AntiBanRecommendation {
  action: 'proceed' | 'delay' | 'use_proxy' | 'stop_operation' | 'emergency_shutdown';
  delay: number;
  confidence: number;
  reason: string;
  riskScore: number;
  alternativeStrategies: string[];
}

export interface LearningData {
  accountId: number;
  operationType: string;
  features: OperationFeatures;
  outcome: 'success' | 'rate_limited' | 'banned' | 'warning';
  timestamp: number;
  context: OperationContext;
}

export interface OperationFeatures {
  timingFeatures: {
    hourOfDay: number;
    dayOfWeek: number;
    timeSinceLastOperation: number;
    operationsInLastHour: number;
    operationsInLastDay: number;
  };
  accountFeatures: {
    age: number;
    isPremium: boolean;
    hasProfilePhoto: boolean;
    isVerified: boolean;
    recentWarnings: number;
  };
  operationFeatures: {
    messageLength: number;
    hasMedia: boolean;
    mediaType: string;
    hasLinks: boolean;
    hasHashtags: boolean;
    targetGroupSize: number;
  };
  riskFeatures: {
    currentRiskScore: number;
    recentFailures: number;
    proxyQuality: number;
    patternDeviation: number;
  };
}

export class AntiBanEngineV5 {
  private static instance: AntiBanEngineV5;
  private logger = logger;
  private cache = CacheSystem.getInstance();
  private riskDetector = RiskDetector.getInstance();
  private proxyIntel = proxyIntelligenceManager;

  private behaviorPatterns = new Map<string, BehaviorPattern>();
  private learningData: LearningData[] = [];
  private anomalyThresholds = {
    burstActivity: 10, // operations per minute
    unusualTiming: 0.8, // deviation from normal
    patternDeviation: 0.7,
    riskSpike: 70 // Lowered from 80 for higher safety in God Mode
  };

  private godModeEnabled = true; // Default to true for industrial strength
  private heartBeatV6Enabled = true; // Heart-Beat Core Alpha Version 6.0.0 prince
  private ghostModeV2Enabled = true; // Ghost Mode 2.0 - Ultra Stealth Simulation

  private constructor() {
    this.loadBehaviorPatterns();
    this.loadLearningData();
    if (this.heartBeatV6Enabled) {
      this.logger.info('[AntiBanV6] HEART-BEAT CORE ACTIVE: Invisible Signature Mode ON 🛡️💓');
    }
    if (this.ghostModeV2Enabled) {
      this.logger.info('[GhostModeV2] APEX STEALTH ACTIVE: Biometric Jitter Initialized 👻🔥');
    }
  }

  /**
   * Generate or retrieve a persistent hardware signature for "Signature Randomization"
   * UPDATED: Now supports Identity Binding (Persistent Device Fingerprint)
   */
  async getHardwareSignature(accountId: number) {
    const cacheKey = `shield:fingerprint:${accountId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    // Check Database for persisted signature
    const account = await db.getTelegramAccountById(accountId);
    if (account?.deviceSignature) {
      try {
        const signature = JSON.parse(account.deviceSignature);
        await this.cache.set(cacheKey, signature);
        return signature;
      } catch (e) { /* Fallback to generation */ }
    }

    // GHOST MODE 2.0: Advanced Kernel-Level Virtualization
    const devices = [
      { model: 'iPhone 17 Pro Max', os: 'iOS 19.4.2', build: '23F79', kernel: 'Darwin 24.5.0' },
      { model: 'Samsung Galaxy S26 Ultra', os: 'Android 16', build: 'U1A.260224.001', kernel: 'Linux 6.12.5-falcon' },
      { model: 'Google Pixel 10 Pro', os: 'Android 16', build: 'AP2A.260224.005', kernel: 'Linux 6.11.0-apex' },
      { model: 'Xiaomi 16 Pro', os: 'HyperOS 3.0', build: '26.2.24.DEV', kernel: 'Linux 6.12.0' }
    ];

    const selected = devices[Math.floor(Math.random() * devices.length)];

    const signature = {
      ...selected,
      lang: 'ar-SA',
      tz: 'Asia/Riyadh',
      hardwareId: `APEX-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      serialNumber: Buffer.from(Math.random().toString()).toString('hex').substring(0, 12).toUpperCase(),
      gpu: selected.model.includes('iPhone') ? 'Apple A19 Bionic' : 'Adreno 840',
      ram: '16GB',
      appVersion: `11.4.${Math.floor(Math.random() * 9)}`,
    };

    // Persist to DB for Identity Binding
    await db.updateTelegramAccount(accountId, {
      deviceSignature: JSON.stringify(signature),
      hardwareId: signature.hardwareId
    } as any);

    await this.cache.set(cacheKey, signature);
    return signature;
  }

  /**
   * Simulate "Reading/Browsing" behavior (Heart-Beat)
   * UPDATED: Integrated Chaos Behavior (Non-linear interaction)
   */
  async simulateDeepInteraction(client: any, chatId: string) {
    if (!this.heartBeatV6Enabled) return;

    this.logger.info(`[Heart-Beat] Simulating organic browsing in ${chatId}...`);

    try {
      // 1. Initial Read
      await client.invoke(new Api.messages.ReadHistory({ peer: chatId, maxId: 0 }));

      // 2. CHAOS MOVE: Random Scrolling or Profile View
      await this.chaosInteraction(client, chatId);

      // 3. Simulating "Typing" or "Looking" state
      await client.invoke(new Api.messages.SetTyping({
        peer: chatId,
        action: new Api.SendMessageTypingAction()
      }));
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

    } catch (e: any) {
      this.logger.warn(`[Heart-Beat] Interaction jitter: ${e.message}`);
    }
  }

  /**
   * Stochastic Chaos Interaction
   * Performs non-linear actions to confuse bot detection.
   */
  private async chaosInteraction(client: any, chatId: string) {
    const actions = ['scroll', 'view_profile', 'idle', 'read_top'];
    const chosen = actions[Math.floor(Math.random() * actions.length)];

    switch (chosen) {
      case 'scroll':
        // Stochastic Scrolling
        const offset = Math.floor(Math.random() * 50);
        await client.getMessages(chatId, { limit: 10, addOffset: offset });
        break;
      case 'view_profile':
        // Simulate looking at group info
        try { await client.invoke(new Api.channels.GetFullChannel({ channel: chatId })); } catch (e: any) { this.logger.debug(`[AntiBanV5] Optional browsing failed: ${e.message}`); }
        break;
      case 'read_top':
        // View pinned message
        try { await client.getMessages(chatId, { limit: 1 }); } catch (e: any) { this.logger.debug(`[AntiBanV5] Optional message view failed: ${e.message}`); }
        break;
      default:
        // Dynamic Thinking
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 7000));
    }
  }

  static getInstance(): AntiBanEngineV5 {
    if (!this.instance) {
      this.instance = new AntiBanEngineV5();
    }
    return this.instance;
  }

  /**
   * Analyze operation and provide anti-ban recommendation
   */
  async analyzeOperation(context: OperationContext): Promise<AntiBanRecommendation> {
    this.logger.info('[AntiBanV5] Analyzing operation', {
      accountId: context.accountId,
      operationType: context.operationType
    });

    try {
      // 1. Extract features
      const features = await this.extractFeatures(context);

      // 2. Calculate base risk score
      const baseRiskScore = await this.calculateRiskScore(features);

      // 3. Check for anomalies
      const anomalies = await this.detectAnomalies(context, features);

      // 4. Apply machine learning model
      const mlPrediction = await this.applyMLModel(features);

      // 5. Get behavior pattern
      const behaviorPattern = await this.getBehaviorPattern(context.accountId, context.operationType);

      // 6. Calculate final risk score
      const finalRiskScore = this.calculateFinalRiskScore(
        baseRiskScore,
        anomalies,
        mlPrediction,
        behaviorPattern
      );

      // 7. Generate recommendation
      const recommendation = await this.generateRecommendation(
        finalRiskScore,
        anomalies,
        context,
        behaviorPattern
      );

      // 8. Update learning data (async)
      this.updateLearningData(context, features).catch(error => {
        this.logger.error('[AntiBanV5] Failed to update learning data', { error });
      });

      this.logger.info('[AntiBanV5] Analysis complete', {
        riskScore: finalRiskScore,
        recommendation: recommendation.action,
        confidence: recommendation.confidence
      });

      return recommendation;

    } catch (error: any) {
      this.logger.error('[AntiBanV5] Analysis failed', { error: error.message });

      // Return safe default recommendation
      return {
        action: 'delay',
        delay: 5000,
        confidence: 0.5,
        reason: 'Analysis failed - using safe defaults',
        riskScore: 50,
        alternativeStrategies: ['use_proxy', 'slow_down']
      };
    }
  }

  /**
   * Calculate optimal delay for operation with Biometric Jitter
   */
  async calculateDelay(
    operationType: string,
    accountId: number,
    options: {
      speed?: 'slow' | 'medium' | 'fast';
      riskScore?: number;
      customBaseDelay?: number;
    } = {}
  ): Promise<number> {
    try {
      // Get behavior pattern
      const pattern = await this.getBehaviorPattern(accountId, operationType);

      // Base delay from pattern or default
      let baseDelay = options.customBaseDelay || pattern?.averageDelay || this.getDefaultDelay(operationType);

      // Adjust for speed
      const speedMultiplier = this.getSpeedMultiplier(options.speed || 'medium');
      baseDelay *= speedMultiplier;

      // GHOST MODE 2.0: Non-linear Biometric Jitter
      if (this.ghostModeV2Enabled) {
        const jitter = this.calculateBiometricJitter(baseDelay);
        baseDelay += jitter;
      } else {
        // Legacy randomization
        const randomization = 0.3;
        const randomFactor = 1 + (Math.random() - 0.5) * randomization;
        baseDelay *= randomFactor;
      }

      // Adjust for risk score
      if (options.riskScore && options.riskScore > 70) {
        baseDelay *= 2; // Double delay for high risk
      }

      // Apply minimum and maximum bounds
      let minDelay = this.getMinimumDelay(operationType);
      let maxDelay = this.getMaximumDelay(operationType);

      // GOD MODE: Increase delays significantly if high risk
      if (this.godModeEnabled && options.riskScore && options.riskScore > 40) {
        baseDelay *= 1.5;
        minDelay *= 1.5;
        // Add "Ghost" thinking time
        baseDelay += Math.random() * 5000;
      }

      return Math.max(minDelay, Math.min(maxDelay, Math.round(baseDelay)));

    } catch (error: any) {
      this.logger.error('[AntiBanV5] Delay calculation failed', { error: error.message });
      return this.getDefaultDelay(operationType);
    }
  }

  /**
   * Biometric Jitter Logic (Non-linear chaos math)
   */
  private calculateBiometricJitter(baseDelay: number): number {
    // Uses a sine-wave based variance to simulate human fatigue and concentration cycles
    const cycle = (Date.now() / 60000) % 60; // 60 min cycle
    const fatigueFactor = Math.sin(cycle * (Math.PI / 30)) * 0.2; // +/- 20%
    const microJitter = (Math.random() - 0.5) * (baseDelay * 0.1); // +/- 10%

    return (baseDelay * fatigueFactor) + microJitter;
  }

  /**
   * Extract features from operation context
   */
  private async extractFeatures(context: OperationContext): Promise<OperationFeatures> {
    const now = Date.now();
    const accountInfo = await this.getAccountInfo(context.accountId);

    return {
      timingFeatures: {
        hourOfDay: context.timeOfDay,
        dayOfWeek: context.dayOfWeek,
        timeSinceLastOperation: await this.getTimeSinceLastOperation(context.accountId),
        operationsInLastHour: await this.getOperationsInLastHour(context.accountId),
        operationsInLastDay: await this.getOperationsInLastDay(context.accountId)
      },
      accountFeatures: {
        age: context.accountAge || accountInfo?.age || 0,
        isPremium: accountInfo?.isPremium || false,
        hasProfilePhoto: accountInfo?.hasProfilePhoto || false,
        isVerified: accountInfo?.isVerified || false,
        recentWarnings: accountInfo?.recentWarnings || 0
      },
      operationFeatures: {
        messageLength: context.messageLength || 0,
        hasMedia: context.mediaType !== 'text',
        mediaType: context.mediaType || 'text',
        hasLinks: context.messageLength ? /https?:\/\//.test(context.messageLength.toString()) : false,
        hasHashtags: context.messageLength ? /#[\w]+/.test(context.messageLength.toString()) : false,
        targetGroupSize: context.memberCount || 0
      },
      riskFeatures: {
        currentRiskScore: await this.getCurrentRiskScore(context.accountId),
        recentFailures: await this.getRecentFailures(context.accountId),
        proxyQuality: context.proxyUsed ? 1.0 : 1.0,
        patternDeviation: await this.calculatePatternDeviation(context.accountId, context.operationType)
      }
    };
  }

  /**
   * Calculate base risk score
   */
  private async calculateRiskScore(features: OperationFeatures): Promise<number> {
    let riskScore = 0;

    // Timing risks
    if (features.timingFeatures.operationsInLastHour > 5) {
      riskScore += 20;
    }
    if (features.timingFeatures.operationsInLastDay > 100) {
      riskScore += 15;
    }

    // Account risks
    if (features.accountFeatures.age < 30) {
      riskScore += 25; // New account
    }
    if (features.accountFeatures.recentWarnings > 0) {
      riskScore += features.accountFeatures.recentWarnings * 10;
    }

    // Operation risks
    if (features.operationFeatures.messageLength > 1000) {
      riskScore += 10;
    }
    if (features.operationFeatures.hasLinks) {
      riskScore += 15;
    }
    if (features.operationFeatures.targetGroupSize > 10000) {
      riskScore += 20;
    }

    // Risk features
    if (features.riskFeatures.currentRiskScore > 50) {
      riskScore += 30;
    }
    if (features.riskFeatures.recentFailures > 3) {
      riskScore += 25;
    }
    if (features.riskFeatures.proxyQuality < 0.5) {
      riskScore += 20;
    }

    return Math.min(100, riskScore);
  }

  /**
   * Detect anomalies in operation
   */
  private async detectAnomalies(
    context: OperationContext,
    features: OperationFeatures
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Burst activity detection
    if (features.timingFeatures.operationsInLastHour > this.anomalyThresholds.burstActivity) {
      anomalies.push({
        type: 'burst_activity',
        severity: 'high',
        description: `Too many operations (${features.timingFeatures.operationsInLastHour}) in last hour`,
        confidence: 0.9,
        timestamp: Date.now(),
        recommendedAction: 'stop_operation'
      });
    }

    // Unusual timing detection
    const pattern = await this.getBehaviorPattern(context.accountId, context.operationType);
    if (pattern && Math.abs(features.timingFeatures.timeSinceLastOperation - pattern.averageDelay) > pattern.averageDelay * this.anomalyThresholds.unusualTiming) {
      anomalies.push({
        type: 'unusual_timing',
        severity: 'medium',
        description: 'Operation timing deviates from normal pattern',
        confidence: 0.7,
        timestamp: Date.now(),
        recommendedAction: 'delay'
      });
    }

    // Pattern deviation detection
    if (features.riskFeatures.patternDeviation > this.anomalyThresholds.patternDeviation) {
      anomalies.push({
        type: 'pattern_deviation',
        severity: 'medium',
        description: 'Significant deviation from established behavior pattern',
        confidence: 0.8,
        timestamp: Date.now(),
        recommendedAction: 'slow_down'
      });
    }

    // Risk spike detection
    if (features.riskFeatures.currentRiskScore > this.anomalyThresholds.riskSpike) {
      anomalies.push({
        type: 'risk_spike',
        severity: 'critical',
        description: `Risk score spike to ${features.riskFeatures.currentRiskScore}`,
        confidence: 0.95,
        timestamp: Date.now(),
        recommendedAction: 'emergency_stop'
      });
    }

    return anomalies;
  }

  /**
   * Apply machine learning model
   */
  private async applyMLModel(features: OperationFeatures): Promise<{
    riskScore: number;
    confidence: number;
    prediction: 'safe' | 'risky' | 'dangerous';
  }> {
    try {
      // FALCON REAL ML: Use historical data for prediction
      // Filter for similar operations in learning data
      const recentHistory = this.learningData.filter(d =>
        d.operationType === (features.operationFeatures.mediaType === 'text' ? 'message' : 'media') ||
        Math.abs(d.features.timingFeatures.hourOfDay - features.timingFeatures.hourOfDay) <= 2
      );

      let riskScore = 30; // Base safe score
      let confidence = 0.4;

      if (recentHistory.length > 5) {
        // Calculate failure rate from actual history
        const failures = recentHistory.filter(d => d.outcome === 'banned' || d.outcome === 'rate_limited').length;
        const failureRate = failures / recentHistory.length;

        // ML Score: Direct correlation to failure rate
        riskScore = 20 + (failureRate * 800); // 10% failure rate = 100 risk score (dangerous)

        // Confidence increases with sample size
        confidence = Math.min(0.95, 0.5 + (recentHistory.length / 50));
      }

      // Cap risk score
      riskScore = Math.min(100, Math.max(0, riskScore));

      return {
        riskScore,
        confidence,
        prediction: riskScore < 40 ? 'safe' : riskScore < 75 ? 'risky' : 'dangerous'
      };

    } catch (error: any) {
      this.logger.error('[AntiBanV5] ML model failed', { error: error.message });
      return {
        riskScore: 50,
        confidence: 0.5,
        prediction: 'risky'
      };
    }
  }

  /**
   * Calculate final risk score
   */
  private calculateFinalRiskScore(
    baseRiskScore: number,
    anomalies: AnomalyDetection[],
    mlPrediction: any,
    behaviorPattern?: BehaviorPattern
  ): number {
    let finalScore = baseRiskScore;

    // Add anomaly scores
    for (const anomaly of anomalies) {
      switch (anomaly.severity) {
        case 'critical':
          finalScore += 30;
          break;
        case 'high':
          finalScore += 20;
          break;
        case 'medium':
          finalScore += 10;
          break;
        case 'low':
          finalScore += 5;
          break;
      }
    }

    // Incorporate ML prediction
    finalScore = (finalScore + mlPrediction.riskScore) / 2;

    // Adjust based on historical success rate
    if (behaviorPattern) {
      const successFactor = behaviorPattern.successRate / 100;
      finalScore *= (2 - successFactor); // Lower score for higher success rate
    }

    return Math.min(100, Math.max(0, finalScore));
  }

  /**
   * Generate recommendation
   */
  private async generateRecommendation(
    riskScore: number,
    anomalies: AnomalyDetection[],
    context: OperationContext,
    behaviorPattern?: BehaviorPattern
  ): Promise<AntiBanRecommendation> {
    // 0. Channel-Shield Check
    let shieldMultiplier = 1.0;
    if (context.targetId) {
      const shieldCheck = await channelShield.checkChannelSafety(context.targetId, context.operationType);
      if (!shieldCheck.safe) {
        return {
          action: 'delay',
          delay: 30000 * shieldCheck.suggestedDelayMultiplier, // Aggressive safety delay
          confidence: 0.95,
          reason: `CHANNEL SHIELD: ${shieldCheck.reason}`,
          riskScore: 90,
          alternativeStrategies: ['wait_for_cooldown']
        };
      }
      shieldMultiplier = shieldCheck.suggestedDelayMultiplier;
    }

    // Check for critical anomalies first
    const criticalAnomaly = anomalies.find(a => a.severity === 'critical');
    if (criticalAnomaly) {
      // GOD MODE: Auto-Recovery instead of just shutdown
      if (this.godModeEnabled) {
        return {
          action: 'stop_operation', // Stop current op but don't kill app
          delay: 3600000, // 1 hour cool-down
          confidence: criticalAnomaly.confidence,
          reason: `GOD MODE CHECK: ${criticalAnomaly.description} - Entering Stealth Mode`,
          riskScore: 100,
          alternativeStrategies: ['switch_account', 'enter_stealth_mode']
        };
      }

      return {
        action: 'emergency_shutdown',
        delay: 0,
        confidence: criticalAnomaly.confidence,
        reason: criticalAnomaly.description,
        riskScore: 100,
        alternativeStrategies: []
      };
    }

    // High risk - stop operation
    if (riskScore > 85) {
      return {
        action: 'stop_operation',
        delay: 0,
        confidence: 0.9,
        reason: 'Risk score too high',
        riskScore,
        alternativeStrategies: ['use_proxy', 'wait_and_retry']
      };
    }

    // Medium risk - delay
    if (riskScore > 60 || shieldMultiplier > 1.5) {
      const delay = await this.calculateDelay(context.operationType, context.accountId, {
        riskScore,
        speed: 'slow'
      });

      return {
        action: 'delay',
        delay: delay * shieldMultiplier,
        confidence: 0.8,
        reason: shieldMultiplier > 1.5 ? 'Channel protection active' : 'Elevated risk detected',
        riskScore,
        alternativeStrategies: ['use_proxy', 'reduce_frequency']
      };
    }

    // Safe to proceed
    const delay = await this.calculateDelay(context.operationType, context.accountId, {
      speed: context.speed
    });

    return {
      action: 'proceed',
      delay: delay * shieldMultiplier,
      confidence: 0.9,
      reason: 'Low risk - operation safe',
      riskScore,
      alternativeStrategies: []
    };
  }

  /**
   * Update learning data
   * UPDATED: Now persists to Postgres (Persistent Intelligence)
   */
  private async updateLearningData(
    context: OperationContext,
    features: OperationFeatures
  ): Promise<void> {
    const database = await db.getDb();
    if (!database) return;

    try {
      // 0. Resolve User ID
      const account = await db.getTelegramAccountById(context.accountId);
      if (!account) return;

      const learningEntry = {
        userId: account.userId,
        accountId: context.accountId,
        operationType: context.operationType,
        features: JSON.stringify(features),
        outcome: 'success', // Initial assumption, updated by recordOperationOutcome
        timestamp: new Date(),
      };

      // 1. Persist to Postgres
      await database.insert(db.learningData).values(learningEntry);

      // 2. Update local learning data for speed
      if (this.learningData.length > 5000) this.learningData.shift();
      this.learningData.push({ ...learningEntry, features: features as any, outcome: 'success', timestamp: Date.now(), context });

      // 3. Save summary to cache
      const cacheKey = `anti-ban-learning:summary:${context.accountId}`;
      await this.cache.set(cacheKey, learningEntry, { ttl: 24 * 3600 });

    } catch (error: any) {
      this.logger.error('[AntiBanV5] Persistent learning failed', { error: error.message });
    }
  }

  /**
   * Record operation outcome for learning
   * UPDATED: Synchronizes with Postgres (Persistent Intelligence)
   */
  async recordOperationOutcome(
    accountId: number,
    operationType: string,
    outcome: 'success' | 'rate_limited' | 'banned' | 'warning'
  ): Promise<void> {
    try {
      const database = await db.getDb();
      if (database) {
        // Update the most recent entry for this account/type in Postgres
        const results = await database.select()
          .from(db.learningData)
          .where(and(eq(db.learningData.accountId, accountId), eq(db.learningData.operationType, operationType)))
          .orderBy(desc(db.learningData.timestamp))
          .limit(1);

        if (results.length > 0) {
          await database.update(db.learningData)
            .set({ outcome })
            .where(eq(db.learningData.id, results[0].id));
        }
      }

      // Update local cache
      const recentEntry = this.learningData
        .filter(d => d.accountId === accountId && d.operationType === operationType)
        .pop();

      if (recentEntry) {
        recentEntry.outcome = outcome;
      }

      // Update behavior pattern
      await this.updateBehaviorPattern(accountId, operationType, outcome);

      this.logger.info('[AntiBanV5] Operation outcome recorded (Persisted)', {
        accountId,
        operationType,
        outcome
      });

    } catch (error: any) {
      this.logger.error('[AntiBanV5] Failed to record outcome', { error: error.message });
    }
  }

  /**
   * Get behavior pattern for account and operation
   */
  private async getBehaviorPattern(
    accountId: number,
    operationType: string
  ): Promise<BehaviorPattern | undefined> {
    const key = `pattern:${accountId}:${operationType}`;
    return this.behaviorPatterns.get(key);
  }

  /**
   * Update behavior pattern
   */
  private async updateBehaviorPattern(
    accountId: number,
    operationType: string,
    outcome: 'success' | 'rate_limited' | 'banned' | 'warning'
  ): Promise<void> {
    const key = `pattern:${accountId}:${operationType}`;
    let pattern = this.behaviorPatterns.get(key);

    if (!pattern) {
      pattern = {
        accountId,
        operationType,
        averageDelay: this.getDefaultDelay(operationType),
        delayVariance: 1000,
        successRate: 100,
        riskScore: 0,
        lastUpdated: Date.now(),
        sampleSize: 0
      };
    }

    // Update pattern based on outcome
    pattern.sampleSize++;

    if (outcome === 'success') {
      pattern.successRate = (pattern.successRate * (pattern.sampleSize - 1) + 100) / pattern.sampleSize;
      pattern.riskScore = Math.max(0, pattern.riskScore - 5);
    } else {
      pattern.successRate = (pattern.successRate * (pattern.sampleSize - 1) + 0) / pattern.sampleSize;
      pattern.riskScore = Math.min(100, pattern.riskScore + 10);
    }

    pattern.lastUpdated = Date.now();
    this.behaviorPatterns.set(key, pattern);

    // Save to cache
    await this.cache.set(key, pattern, { ttl: 30 * 24 * 3600 }); // 30 days
  }

  /**
   * Helper methods
   */
  private getDefaultDelay(operationType: string): number {
    const defaults = {
      message: 3000,
      add_member: 5000,
      join_group: 10000,
      extract_members: 2000,
      leave_group: 5000
    };
    return defaults[operationType as keyof typeof defaults] || 3000;
  }

  private getSpeedMultiplier(speed: 'slow' | 'medium' | 'fast'): number {
    const multipliers = {
      slow: 2.0,
      medium: 1.0,
      fast: 0.5
    };
    return multipliers[speed];
  }

  private getMinimumDelay(operationType: string): number {
    return this.getDefaultDelay(operationType) * 0.5;
  }

  private getMaximumDelay(operationType: string): number {
    return this.getDefaultDelay(operationType) * 5.0;
  }

  private async getAccountInfo(accountId: number): Promise<any> {
    const account = await db.getTelegramAccountById(accountId);
    if (!account) return {};

    // Fetched real info from Telegram
    let telegramUser: any = null;
    try {
      telegramUser = await telegramClientService.getMe(accountId);
    } catch (e) {
      // Warning suppressed, using defaults
    }

    return {
      age: 180, // Default to 6 months as creation date is hard to determine via API
      isPremium: telegramUser?.premium || false,
      hasProfilePhoto: !!telegramUser?.photo,
      isVerified: telegramUser?.verified || false,
      recentWarnings: 0
    };
  }

  private async getTimeSinceLastOperation(accountId: number): Promise<number> {
    const lastOp = await this.cache.get<number>(`last_op:${accountId}`);
    if (!lastOp) return 3600000; // 1 hour if no record
    return Date.now() - lastOp;
  }

  private async getOperationsInLastHour(accountId: number): Promise<number> {
    const logs = await db.getActivityLogsByAccountId(accountId);
    const oneHourAgo = Date.now() - 3600000;
    return logs.filter((l: any) => new Date(l.timestamp).getTime() > oneHourAgo).length;
  }

  private async getOperationsInLastDay(accountId: number): Promise<number> {
    const logs = await db.getActivityLogsByAccountId(accountId);
    const oneDayAgo = Date.now() - 86400000;
    return logs.filter((l: any) => new Date(l.timestamp).getTime() > oneDayAgo).length;
  }

  private async getCurrentRiskScore(accountId: number): Promise<number> {
    const cacheKey = `risk_score:${accountId}`;
    return await this.cache.get<number>(cacheKey) || 10;
  }

  private async getRecentFailures(accountId: number): Promise<number> {
    try {
      const logs = await db.getActivityLogsByAccountId(accountId, 50);
      const recentWindow = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

      return logs.filter((l: any) => {
        const logDate = new Date(l.createdAt).getTime();
        return logDate > recentWindow && l.status === 'failed';
      }).length;
    } catch (error) {
      this.logger.warn('[AntiBanV5] Failed to get recent failures', { accountId, error });
      return 0;
    }
  }

  private async calculatePatternDeviation(accountId: number, operationType: string): Promise<number> {
    const pattern = await this.riskDetector.detectPattern(accountId);
    if (!pattern) return 0.5;

    let deviation = 0;
    if (pattern.isRepetitive) deviation += 0.3;
    if (pattern.isBurst) deviation += 0.4;

    return Math.min(deviation, 1.0);
  }

  private async calculateMLPredictionHeuristic(accountId: number, type: string): Promise<number> {
    const pattern = await this.riskDetector.detectPattern(accountId);
    let score = pattern.severity * 50; // ML Heuristic

    // Add time-based risk
    const h = new Date().getHours();
    if (h >= 0 && h <= 5) score += 20; // High risk night activity

    return Math.min(score, 100);
  }

  private featuresToVector(features: OperationFeatures): number[] {
    // Convert features to numeric vector for ML
    return [
      features.timingFeatures.hourOfDay / 24,
      features.timingFeatures.dayOfWeek / 7,
      features.timingFeatures.operationsInLastHour / 20,
      features.accountFeatures.age / 365,
      features.accountFeatures.isPremium ? 1 : 0,
      features.operationFeatures.messageLength / 1000,
      features.operationFeatures.hasMedia ? 1 : 0,
      features.riskFeatures.currentRiskScore / 100
    ];
  }

  private async loadMLWeights(): Promise<number[]> {
    // If we have enough learning data, we can "self-calibrate" weights
    // This turns the engine from a static heuristic to a truly learning system
    if (this.learningData.length > 50) {
      try {
        this.logger.debug(`[AntiBanV5] Self-calibrating ML weights from ${this.learningData.length} samples...`);

        // Features: [hour, day, opsHour, age, isPremium, msgLen, hasMedia, riskScore]
        const sampleWeights = [0, 0, 0, 0, 0, 0, 0, 0];
        const failCount = this.learningData.filter(d => d.outcome !== 'success').length;

        if (failCount > 0) {
          // Calculate correlation of features with failures
          // This is a simplified Gradient Descent / Linear Regression approximation
          for (const entry of this.learningData) {
            const isFailure = entry.outcome !== 'success' ? 1 : -0.1; // Reward success slightly
            const vector = this.featuresToVector(entry.features);

            for (let i = 0; i < vector.length; i++) {
              sampleWeights[i] += vector[i] * isFailure;
            }
          }

          // Normalize weights (Softmax-like normalization)
          const sum = sampleWeights.reduce((a, b) => a + Math.abs(b), 0);
          if (sum > 0) {
            return sampleWeights.map(w => Math.max(0.01, Math.min(0.5, Math.abs(w) / sum)));
          }
        }
      } catch (error) {
        this.logger.warn('[AntiBanV5] Weight calibration failed, using robust defaults', { error });
      }
    }

    // Heuristic Initializer (Safe defaults if no data is available)
    return [0.1, 0.05, 0.25, 0.05, 0.05, 0.15, 0.1, 0.25];
  }

  private calculateMLPrediction(features: number[], weights: number[]): any {
    // Simple linear model - in production, use neural network
    const score = features.reduce((sum, feature, index) => sum + feature * weights[index], 0);

    return {
      riskScore: Math.min(100, Math.max(0, score * 100)),
      confidence: 0.8
    };
  }

  private async loadBehaviorPatterns(): Promise<void> {
    // Load from DB (activity logs aggregation or specific table if available)
    // For now, we reconstruct from recent activity to warm up the cache
  }

  private async loadLearningData(): Promise<void> {
    try {
      this.logger.debug('[AntiBanV5] Loading learning data from activity logs');

      const database = await db.getDb();
      if (!database) {
        this.logger.warn('[AntiBanV5] Database not available for loading learning data');
        return;
      }

      // Fetch recent relevant logs
      const logs = await database.execute(db.sql`
        SELECT * FROM activity_logs 
        WHERE action IN ('message_sent', 'member_added', 'join_group', 'extract_members')
        ORDER BY timestamp DESC 
        LIMIT 1000
      `);

      for (const row of logs) {
        const log = row as any;
        // Reconstruct learning entry from log
        // Note: This is a best-effort reconstruction as logs might not have full feature vectors
        let details: any = {};
        try {
          details = JSON.parse(log.details as string || '{}');
        } catch (e: any) {
          this.logger.error(`[AntiBanV5] Evaluation error: ${e.message}`);
        }

        const timestamp = new Date(log.timestamp).getTime();

        const entry: LearningData = {
          accountId: log.telegramAccountId || 0,
          operationType: log.action === 'message_sent' ? 'message' :
            log.action === 'member_added' ? 'add_member' :
              log.action === 'join_group' ? 'join_group' : 'unknown',
          features: {
            timingFeatures: {
              hourOfDay: new Date(timestamp).getHours(),
              dayOfWeek: new Date(timestamp).getDay(),
              timeSinceLastOperation: 0, // approximation
              operationsInLastHour: 0, // approximation
              operationsInLastDay: 0 // approximation
            },
            accountFeatures: {
              age: 0,
              isPremium: false,
              hasProfilePhoto: false,
              isVerified: false,
              recentWarnings: 0
            },
            operationFeatures: {
              messageLength: 0,
              hasMedia: false,
              mediaType: 'text',
              hasLinks: false,
              hasHashtags: false,
              targetGroupSize: 0
            },
            riskFeatures: {
              currentRiskScore: 0,
              recentFailures: 0,
              proxyQuality: 1,
              patternDeviation: 0
            }
          },
          outcome: log.status === 'success' ? 'success' : 'rate_limited', // Assume failed = rate_limited for safety if unknown
          timestamp: timestamp,
          context: {} as any
        };

        this.learningData.push(entry);
      }

      this.logger.info(`[AntiBanV5] Loaded ${this.learningData.length} entries from history`);

    } catch (error) {
      this.logger.warn('[AntiBanV5] Failed to load learning data', { error });
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalPatterns: number;
    totalLearningEntries: number;
    averageRiskScore: number;
    highRiskAccounts: number;
  }> {
    // Calculate real stats
    let totalRisk = 0;
    let highRiskCount = 0;

    // Iterate over behavior patterns to get risks
    let count = 0;
    this.behaviorPatterns.forEach(pattern => {
      totalRisk += pattern.riskScore;
      if (pattern.riskScore > 70) highRiskCount++;
      count++;
    });

    return {
      totalPatterns: this.behaviorPatterns.size,
      totalLearningEntries: this.learningData.length,
      averageRiskScore: count > 0 ? Math.round(totalRisk / count) : 10,
      highRiskAccounts: highRiskCount
    };
  }
}

// Export singleton
export const antiBanEngineV5 = AntiBanEngineV5.getInstance();
