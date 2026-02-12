import { TelegramClient } from "telegram";
import * as db from "../db";
import { proxyManager } from "./proxy-manager";

/**
 * Anti-Ban Core Engine - الأساس القوي للحماية من الحظر
 * يوفر حماية فائقة ضد الحظر مع أداء فائق
 */

// Interface definitions
interface OperationRecord {
  timestamp: Date;
  type: OperationType;
  success: boolean;
  duration: number;
  errorType?: string;
  proxyUsed?: string;
  riskLevel: RiskLevel;
}

interface RiskScore {
  score: number;
  factors: RiskFactor[];
}

interface RiskFactor {
  type: string;
  weight: number;
  value: number;
  description: string;
}

interface AccountHealth {
  accountId: number;
  score: number;
  lastActivity: Date;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  totalOperations: number;
  riskLevel: RiskLevel;
  cooldownUntil?: Date;
  lastFingerprintChange: Date;
}

interface Performance {
  successRate: number;
  averageDelay: number;
  riskTrend: number;
  lastUpdate: Date;
}

interface EmergencyResponse {
  action: 'pause' | 'change_proxy' | 'increase_delay' | 'emergency_stop';
  reason?: string;
  retryAfter?: Date;
  suggestedDelay: number;
  riskLevel?: RiskLevel;
  precautions?: string[];
}

interface OperationDecision {
  allowed: boolean;
  suggestedDelay: number;
  riskLevel: RiskLevel;
  precautions?: string[];
  emergencyResponse?: EmergencyResponse;
}

interface OperationResult {
  success: boolean;
  errorType?: string;
  duration?: number;
  proxyUsed?: string;
}

interface AccountStatus {
  health: AccountHealth;
  riskScore?: RiskScore;
  recentOperations: OperationRecord[];
  isHealthy: boolean;
  canOperate: boolean;
}

type OperationType = 'message' | 'join_group' | 'add_user' | 'leave_group' | 'extract_members' | 'boost_engagement';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export class AntiBanCoreEngine {
  private static instance: AntiBanCoreEngine;
  private accountHealth: Map<number, AccountHealth> = new Map();
  private operationHistory: Map<number, OperationRecord[]> = new Map();
  private riskScores: Map<number, RiskScore> = new Map();
  
  private constructor() {}

  static getInstance(): AntiBanCoreEngine {
    if (!AntiBanCoreEngine.instance) {
      AntiBanCoreEngine.instance = new AntiBanCoreEngine();
    }
    return AntiBanCoreEngine.instance;
  }

  /**
   * تهيئة حساب جديد مع إعدادات حماية قصوى
   */
  async initializeAccount(accountId: number): Promise<void> {
    const health: AccountHealth = {
      accountId,
      score: 100,
      lastActivity: new Date(),
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      totalOperations: 0,
      riskLevel: 'low',
      cooldownUntil: null,
      lastFingerprintChange: new Date()
    };

    this.accountHealth.set(accountId, health);
    this.operationHistory.set(accountId, []);
    this.riskScores.set(accountId, { score: 0, factors: [] });

    // تهيئة إعدادات الحماية في قاعدة البيانات
    await this.initializeProtectionSettings(accountId);
  }

  /**
   * التحقق قبل أي عملية - نقطة الدخول الرئيسية
   */
  async preOperationCheck(accountId: number, operationType: OperationType): Promise<OperationDecision> {
    const health = this.accountHealth.get(accountId);
    if (!health) {
      await this.initializeAccount(accountId);
      return { allowed: true, suggestedDelay: 1000, riskLevel: 'low' };
    }

    // التحقق من cooldown
    if (health.cooldownUntil && new Date() < health.cooldownUntil) {
      return {
        allowed: false,
        suggestedDelay: health.cooldownUntil.getTime() - Date.now(),
        riskLevel: 'critical',
        emergencyResponse: {
          action: 'pause',
          reason: 'Account in cooldown period',
          retryAfter: health.cooldownUntil,
          suggestedDelay: health.cooldownUntil.getTime() - Date.now()
        }
      };
    }

    // حساب المخاطر
    const riskScore = await this.calculateRiskScore(accountId, operationType);
    const suggestedDelay = this.calculateOptimalDelay(accountId, operationType, riskScore);

    // اتخاذ قرار
    const decision: OperationDecision = {
      allowed: riskScore.score < 80, // عتبة المخاطر
      suggestedDelay,
      riskLevel: this.getRiskLevel(riskScore.score)
    };

    // إضافة استجابة طارئة إذا لزم الأمر
    if (riskScore.score > 90) {
      decision.emergencyResponse = await this.generateEmergencyResponse(accountId, riskScore);
    }

    return decision;
  }

  /**
   * تسجيل نتيجة العملية
   */
  async recordOperationResult(accountId: number, operationType: OperationType, result: OperationResult): Promise<void> {
    const health = this.accountHealth.get(accountId);
    if (!health) return;

    // تحديث صحة الحساب
    if (result.success) {
      health.consecutiveSuccesses++;
      health.consecutiveFailures = 0;
      health.score = Math.min(100, health.score + 2);
    } else {
      health.consecutiveFailures++;
      health.consecutiveSuccesses = 0;
      health.score = Math.max(0, health.score - 5);

      // تطبيق cooldown إذا كان هناك فشل متكرر
      if (health.consecutiveFailures >= 3) {
        health.cooldownUntil = new Date(Date.now() + Math.pow(2, health.consecutiveFailures) * 60000);
      }
    }

    health.lastActivity = new Date();
    health.totalOperations++;

    // تسجيل العملية
    const record: OperationRecord = {
      timestamp: new Date(),
      type: operationType,
      success: result.success,
      duration: result.duration || 0,
      errorType: result.errorType,
      proxyUsed: result.proxyUsed,
      riskLevel: this.getRiskLevel(this.riskScores.get(accountId)?.score || 0)
    };

    const history = this.operationHistory.get(accountId) || [];
    history.push(record);
    
    // الاحتفاظ بآخر 100 عملية فقط
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.operationHistory.set(accountId, history);

    // تحديث مستوى المخاطر
    health.riskLevel = this.getRiskLevel(health.score);

    // حفظ في قاعدة البيانات
    await this.saveAccountHealth(accountId, health);
  }

  /**
   * حساب درجة المخاطر
   */
  private async calculateRiskScore(accountId: number, operationType: OperationType): Promise<RiskScore> {
    const health = this.accountHealth.get(accountId);
    const history = this.operationHistory.get(accountId) || [];
    
    const factors: RiskFactor[] = [];

    // عامل معدل النجاح
    const recentOperations = history.slice(-20);
    const successRate = recentOperations.length > 0 
      ? recentOperations.filter(op => op.success).length / recentOperations.length 
      : 1;
    
    factors.push({
      type: 'success_rate',
      weight: 0.3,
      value: successRate,
      description: `معدل النجاح: ${(successRate * 100).toFixed(1)}%`
    });

    // عامل الفشل المتكرر
    if (health) {
      factors.push({
        type: 'consecutive_failures',
        weight: 0.4,
        value: health.consecutiveFailures / 10,
        description: `فشل متكرر: ${health.consecutiveFailures} مرات`
      });
    }

    // عامل توقيت العمليات
    const now = new Date();
    const recentHourOperations = recentOperations.filter(op => 
      now.getTime() - op.timestamp.getTime() < 3600000
    );
    
    factors.push({
      type: 'operation_frequency',
      weight: 0.2,
      value: Math.min(recentHourOperations.length / 10, 1),
      description: `العمليات في الساعة: ${recentHourOperations.length}`
    });

    // عامل نوع العملية
    const operationRisk = {
      'message': 0.1,
      'join_group': 0.3,
      'add_user': 0.4,
      'leave_group': 0.2,
      'extract_members': 0.5,
      'boost_engagement': 0.3
    };
    
    factors.push({
      type: 'operation_type',
      weight: 0.1,
      value: operationRisk[operationType] || 0.2,
      description: `مخاطر العملية: ${operationType}`
    });

    // حساب الدرجة الإجمالية
    const score = factors.reduce((total, factor) => 
      total + (factor.value * factor.weight), 0
    ) * 100;

    this.riskScores.set(accountId, { score, factors });
    return { score, factors };
  }

  /**
   * حساب التأخير الأمثل
   */
  private calculateOptimalDelay(accountId: number, operationType: OperationType, riskScore: RiskScore): number {
    const baseDelays = {
      'message': 2000,
      'join_group': 5000,
      'add_user': 8000,
      'leave_group': 3000,
      'extract_members': 10000,
      'boost_engagement': 4000
    };

    const baseDelay = baseDelays[operationType] || 3000;
    const riskMultiplier = 1 + (riskScore.score / 100) * 3;
    
    return Math.floor(baseDelay * riskMultiplier);
  }

  /**
   * الحصول على مستوى المخاطر
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }

  /**
   * إنشاء استجابة طارئة
   */
  private async generateEmergencyResponse(accountId: number, riskScore: RiskScore): Promise<EmergencyResponse> {
    const health = this.accountHealth.get(accountId);
    
    if (!health) {
      return {
        action: 'emergency_stop',
        reason: 'Account health unknown',
        suggestedDelay: 300000, // 5 دقائق
        riskLevel: 'critical'
      };
    }

    // تحديد الإجراء بناءً على عوامل المخاطر
    const primaryRisk = riskScore.factors.reduce((max, factor) => 
      factor.value > max.value ? factor : max, riskScore.factors[0]
    );

    let action: EmergencyResponse['action'] = 'pause';
    let reason = '';
    let suggestedDelay = 60000; // دقيقة واحدة

    switch (primaryRisk.type) {
      case 'consecutive_failures':
        action = 'change_proxy';
        reason = 'فشل متكرر - تغيير البروكسي';
        suggestedDelay = 30000;
        break;
      case 'operation_frequency':
        action = 'increase_delay';
        reason = 'عمليات كثيرة - زيادة التأخير';
        suggestedDelay = 120000;
        break;
      case 'success_rate':
        action = 'pause';
        reason = 'معدل نجاح منخفض - وقفة مؤقتة';
        suggestedDelay = 180000;
        break;
      default:
        action = 'emergency_stop';
        reason = 'مخاطر عالية - توقف طارئ';
        suggestedDelay = 600000;
    }

    // تطبيق cooldown
    health.cooldownUntil = new Date(Date.now() + suggestedDelay);

    return {
      action,
      reason,
      retryAfter: health.cooldownUntil,
      suggestedDelay,
      riskLevel: this.getRiskLevel(riskScore.score),
      precautions: [
        'تقليل عدد العمليات',
        'زيادة الفواصل الزمنية',
        'مراقبة صحة الحساب',
        'تغيير البروكسي إذا لزم الأمر'
      ]
    };
  }

  /**
   * تهيئة إعدادات الحماية في قاعدة البيانات
   */
  private async initializeProtectionSettings(accountId: number): Promise<void> {
    try {
      await db.updateAntiBanRules(accountId, {
        maxMessagesPerHour: 30,
        maxJoinsPerHour: 5,
        delayBetweenMessages: 2000,
        delayBetweenJoins: 5000,
        enableProxyRotation: true,
        enableSmartDelays: true,
        enableEmergencyStop: true,
        riskThreshold: 80
      });
    } catch (error) {
      console.error('Error initializing protection settings:', error);
    }
  }

  /**
   * حفظ صحة الحساب في قاعدة البيانات
   */
  private async saveAccountHealth(accountId: number, health: AccountHealth): Promise<void> {
    try {
      await db.updateTelegramAccount(accountId, {
        isActive: health.score > 50,
        isRestricted: health.score < 20,
        lastActivityAt: health.lastActivity,
        warmingLevel: Math.floor(health.score)
      });
    } catch (error) {
      console.error('Error saving account health:', error);
    }
  }

  /**
   * الحصول على حالة الحساب
   */
  async getAccountStatus(accountId: number): Promise<AccountStatus> {
    const health = this.accountHealth.get(accountId);
    const riskScore = this.riskScores.get(accountId);
    const recentOperations = this.operationHistory.get(accountId) || [];

    if (!health) {
      await this.initializeAccount(accountId);
      return this.getAccountStatus(accountId);
    }

    return {
      health,
      riskScore,
      recentOperations: recentOperations.slice(-10),
      isHealthy: health.score > 50,
      canOperate: !health.cooldownUntil || new Date() >= health.cooldownUntil
    };
  }

  /**
   * إعادة تعيين صحة الحساب
   */
  async resetAccountHealth(accountId: number): Promise<void> {
    await this.initializeAccount(accountId);
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  async getPerformanceMetrics(accountId: number): Promise<Performance> {
    const history = this.operationHistory.get(accountId) || [];
    const recentHistory = history.slice(-50);

    if (recentHistory.length === 0) {
      return {
        successRate: 100,
        averageDelay: 3000,
        riskTrend: 0,
        lastUpdate: new Date()
      };
    }

    const successRate = recentHistory.filter(op => op.success).length / recentHistory.length * 100;
    const averageDelay = recentHistory.reduce((sum, op) => sum + op.duration, 0) / recentHistory.length;
    
    // حساب اتجاه المخاطر
    const oldRisk = this.riskScores.get(accountId)?.score || 0;
    const currentRisk = await this.calculateRiskScore(accountId, 'message');
    const riskTrend = currentRisk.score - oldRisk;

    return {
      successRate,
      averageDelay,
      riskTrend,
      lastUpdate: new Date()
    };
  }
}

// Export singleton instance and interfaces
export const antiBanCore = AntiBanCoreEngine.getInstance();
export type { OperationDecision, OperationResult, AccountHealth, RiskFactor, Performance, EmergencyResponse };
