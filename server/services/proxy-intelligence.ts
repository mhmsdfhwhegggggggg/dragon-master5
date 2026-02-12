import { proxyManager, ProxyConfig } from "./proxy-manager";

/**
 * Proxy Intelligence Manager - إدارة البروكسي الذكية
 * يوفر إدارة متقدمة للبروكسي مع تحليل الأداء والصحة
 */
export class ProxyIntelligenceManager {
  private static instance: ProxyIntelligenceManager;
  private proxyPerformance: Map<string, ProxyPerformance> = new Map();
  private proxyPools: Map<number, ProxyPool> = new Map();
  private locationAnalysis: Map<string, LocationData> = new Map();
  private rotationStrategies: Map<number, RotationStrategy> = new Map();
  
  private constructor() {
    this.initializeLocationData();
  }

  static getInstance(): ProxyIntelligenceManager {
    if (!ProxyIntelligenceManager.instance) {
      ProxyIntelligenceManager.instance = new ProxyIntelligenceManager();
    }
    return ProxyIntelligenceManager.instance;
  }

  /**
   * الحصول على بروكسي ذكي لحساب معين
   */
  async getOptimalProxy(accountId: number, operationType: OperationType, context: ProxyContext): Promise<OptimalProxyResult> {
    const pool = this.getProxyPool(accountId);
    
    // 1. فلترة البروكسي المتاحة
    const availableProxies = await this.filterAvailableProxies(pool.proxies);
    
    if (availableProxies.length === 0) {
      return {
        proxy: null,
        reason: 'NO_AVAILABLE_PROXIES',
        alternatives: await this.generateAlternatives(accountId),
        recommendations: ['ADD_MORE_PROXIES', 'CHECK_PROXY_HEALTH']
      };
    }

    // 2. تحليل أداء البروكسي
    const performanceScores = await this.analyzeProxyPerformance(availableProxies, operationType, context);
    
    // 3. تطبيق استراتيجية الدوران
    const rotationStrategy = this.getRotationStrategy(accountId);
    const selectedProxy = this.applyRotationStrategy(availableProxies, performanceScores, rotationStrategy);
    
    // 4. التحقق من صحة البروكسي
    const healthCheck = await this.validateProxy(selectedProxy);
    
    if (!healthCheck.isHealthy) {
      await this.markProxyUnhealthy(selectedProxy.id?.toString() || '');
      return this.getOptimalProxy(accountId, operationType, context); // إعادة المحاولة
    }

    // 5. تسجيل الاستخدام
    await this.recordProxyUsage(selectedProxy.id?.toString() || '', accountId, operationType);

    return {
      proxy: selectedProxy,
      confidence: performanceScores.get(selectedProxy.id?.toString() || '')?.confidence || 0.5,
      reasoning: this.generateProxyReasoning(selectedProxy, performanceScores),
      expectedPerformance: performanceScores.get(selectedProxy.id?.toString() || '')?.expectedPerformance || 'medium',
      nextRotationTime: this.calculateNextRotation(selectedProxy, rotationStrategy)
    };
  }

  /**
   * تحليل أداء البروكسي
   */
  private async analyzeProxyPerformance(
    proxies: ProxyConfig[],
    operationType: OperationType,
    context: ProxyContext
  ): Promise<Map<string, ProxyScore>> {
    const scores = new Map<string, ProxyScore>();

    for (const proxy of proxies) {
      const performance = this.proxyPerformance.get(proxy.id) || await this.initializeProxyPerformance(proxy.id);
      
      let score = 0;
      const factors: PerformanceFactor[] = [];

      // 1. تحليل معدل النجاح
      const successRate = this.calculateSuccessRate(performance, operationType);
      score += successRate * 30;
      factors.push({ type: 'success_rate', value: successRate, weight: 0.3 });

      // 2. تحليل سرعة الاستجابة
      const responseTime = this.getAverageResponseTime(performance);
      const speedScore = Math.max(0, 1 - (responseTime / 5000)); // 5 ثواني كحد أقصى
      score += speedScore * 25;
      factors.push({ type: 'response_time', value: speedScore, weight: 0.25 });

      // 3. تحليل الاستقرار
      const stability = this.calculateStability(performance);
      score += stability * 20;
      factors.push({ type: 'stability', value: stability, weight: 0.2 });

      // 4. تحليل الموقع الجغرافي
      const locationScore = this.analyzeLocationSuitability(proxy, context);
      score += locationScore * 15;
      factors.push({ type: 'location', value: locationScore, weight: 0.15 });

      // 5. تحليل الحمولة
      const loadScore = this.calculateLoadScore(performance);
      score += loadScore * 10;
      factors.push({ type: 'load', value: loadScore, weight: 0.1 });

      scores.set(proxy.id, {
        totalScore: Math.min(score, 100),
        confidence: this.calculatePerformanceConfidence(performance),
        expectedPerformance: this.determineExpectedPerformance(score),
        factors,
        recommendation: this.generateProxyRecommendation(score, factors)
      });
    }

    return scores;
  }

  /**
   * تطبيق استراتيجية الدوران
   */
  private applyRotationStrategy(
    proxies: ProxyConfig[],
    scores: Map<string, ProxyScore>,
    strategy: RotationStrategy
  ): ProxyConfig {
    switch (strategy.type) {
      case 'performance_based':
        return this.selectByPerformance(proxies, scores);
      
      case 'round_robin':
        return this.selectByRoundRobin(proxies, strategy);
      
      case 'weighted_random':
        return this.selectByWeightedRandom(proxies, scores);
      
      case 'location_based':
        return this.selectByLocation(proxies, strategy);
      
      case 'load_balanced':
        return this.selectByLoadBalance(proxies, scores);
      
      default:
        return this.selectByPerformance(proxies, scores);
    }
  }

  /**
   * الاختيار بناءً على الأداء
   */
  private selectByPerformance(proxies: ProxyConfig[], scores: Map<string, ProxyScore>): ProxyConfig {
    return proxies.reduce((best, current) => {
      const bestScore = scores.get(best.id?.toString() || '')?.totalScore || 0;
      const currentScore = scores.get(current.id?.toString() || '')?.totalScore || 0;
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * الاختيار بالدوران
   */
  private selectByRoundRobin(proxies: ProxyConfig[], strategy: RotationStrategy): ProxyConfig {
    const index = strategy.currentIndex % proxies.length;
    strategy.currentIndex = (strategy.currentIndex + 1) % proxies.length;
    return proxies[index];
  }

  /**
   * الاختيار العشوائي الموزون
   */
  private selectByWeightedRandom(proxies: ProxyConfig[], scores: Map<string, ProxyScore>): ProxyConfig {
    const totalScore = Array.from(scores.values()).reduce((sum, score) => sum + score.totalScore, 0);
    let random = Math.random() * totalScore;
    
    for (const proxy of proxies) {
      const score = scores.get(proxy.id)?.totalScore || 0;
      random -= score;
      if (random <= 0) {
        return proxy;
      }
    }
    
    return proxies[0]; // fallback
  }

  /**
   * الاختيار بناءً على الموقع
   */
  private selectByLocation(proxies: ProxyConfig[], strategy: RotationStrategy): ProxyConfig {
    // اختر البروكسي من الموقع المفضل
    const preferredLocation = strategy.preferredLocations?.[0];
    if (preferredLocation) {
      const locationProxy = proxies.find(p => this.getProxyLocation(p) === preferredLocation);
      if (locationProxy) return locationProxy;
    }
    
    // إذا لم يتم العثور على الموقع المفضل، اختر الأفضل أداءً
    return this.selectByPerformance(proxies, new Map());
  }

  /**
   * الاختيار بناءً على توازن الحمولة
   */
  private selectByLoadBalance(proxies: ProxyConfig[], scores: Map<string, ProxyScore>): ProxyConfig {
    return proxies.reduce((best, current) => {
      const bestLoad = this.getCurrentLoad(best.id?.toString() || '');
      const currentLoad = this.getCurrentLoad(current.id?.toString() || '');
      
      if (Math.abs(bestLoad - currentLoad) < 0.1) {
        // إذا كانت الأحمال متقاربة، اختر الأفضل أداءً
        const bestScore = scores.get(best.id?.toString() || '')?.totalScore || 0;
        const currentScore = scores.get(current.id?.toString() || '')?.totalScore || 0;
        return currentScore > bestScore ? current : best;
      }
      
      return currentLoad < bestLoad ? current : best;
    });
  }

  /**
   * تسجيل استخدام البروكسي
   */
  async recordProxyUsage(proxyId: string, accountId: number, operationType: OperationType): Promise<void> {
    const performance = this.proxyPerformance.get(proxyId) || await this.initializeProxyPerformance(proxyId);
    
    // تحديث الإحصائيات
    performance.totalUsage++;
    performance.lastUsed = new Date();
    
    const operationStats = performance.operationStats.get(operationType) || {
      count: 0,
      successCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0
    };
    
    operationStats.count++;
    performance.operationStats.set(operationType, operationStats);
    
    this.proxyPerformance.set(proxyId, performance);
  }

  /**
   * تسجيل نتيجة استخدام البروكسي
   */
  async recordProxyResult(
    proxyId: string,
    operationType: OperationType,
    result: ProxyOperationResult
  ): Promise<void> {
    const performance = this.proxyPerformance.get(proxyId);
    if (!performance) return;

    const operationStats = performance.operationStats.get(operationType);
    if (!operationStats) return;

    if (result.success) {
      operationStats.successCount++;
      performance.consecutiveFailures = 0;
    } else {
      performance.consecutiveFailures++;
      
      // إذا كان هناك فشل متتالي، قلل الصحة
      if (performance.consecutiveFailures >= 3) {
        performance.health = 'poor';
      } else if (performance.consecutiveFailures >= 2) {
        performance.health = 'fair';
      }
    }

    if (result.responseTime) {
      operationStats.totalResponseTime += result.responseTime;
      operationStats.averageResponseTime = operationStats.totalResponseTime / operationStats.count;
    }

    // تحديث الصحة العامة
    this.updateProxyHealth(proxyId);

    // حفظ التحديثات
    this.proxyPerformance.set(proxyId, performance);
  }

  /**
   * تحديث صحة البروكسي
   */
  private updateProxyHealth(proxyId: string): void {
    const performance = this.proxyPerformance.get(proxyId);
    if (!performance) return;

    let healthScore = 0;
    let totalWeight = 0;

    // حساب الصحة بناءً على معدل النجاح
    for (const [operationType, stats] of performance.operationStats) {
      const successRate = stats.count > 0 ? stats.successCount / stats.count : 0;
      const weight = this.getOperationWeight(operationType);
      
      healthScore += successRate * weight;
      totalWeight += weight;
    }

    const overallSuccessRate = totalWeight > 0 ? healthScore / totalWeight : 0;

    // تحديد مستوى الصحة
    if (overallSuccessRate >= 0.95) {
      performance.health = 'excellent';
    } else if (overallSuccessRate >= 0.85) {
      performance.health = 'good';
    } else if (overallSuccessRate >= 0.70) {
      performance.health = 'fair';
    } else {
      performance.health = 'poor';
    }
  }

  /**
   * الحصول على تجمع البروكسي
   */
  private getProxyPool(accountId: number): ProxyPool {
    let pool = this.proxyPools.get(accountId);
    
    if (!pool) {
      pool = {
        accountId,
        proxies: [],
        lastUpdated: new Date(),
        healthStatus: 'unknown'
      };
      this.proxyPools.set(accountId, pool);
    }
    
    return pool;
  }

  /**
   * فلترة البروكسي المتاحة
   */
  private async filterAvailableProxies(proxies: ProxyConfig[]): Promise<ProxyConfig[]> {
    const available: ProxyConfig[] = [];
    
    for (const proxy of proxies) {
      const performance = this.proxyPerformance.get(proxy.id?.toString() || '');
      
      // تجاهل البروكسي غير الصحية
      if (performance && performance.health === 'poor') {
        continue;
      }
      
      // تجاهل البروكسي المحظورة مؤقتاً
      if (performance && performance.blockedUntil && performance.blockedUntil > new Date()) {
        continue;
      }
      
      available.push(proxy);
    }
    
    return available;
  }

  /**
   * التحقق من صحة البروكسي
   */
  private async validateProxy(proxy: ProxyConfig): Promise<ProxyHealthCheck> {
    try {
      const startTime = Date.now();
      
      // محاولة اتصال سريع
      const response = await this.testProxyConnection(proxy);
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: response.success,
        responseTime,
        error: response.error,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * اختبار اتصال البروكسي
   */
  private async testProxyConnection(proxy: ProxyConfig): Promise<{ success: boolean; error?: string }> {
    // سيتم تنفيذها لاحقاً مع اتصال فعلي
    return { success: true };
  }

  /**
   * تهيئة أداء البروكسي
   */
  private async initializeProxyPerformance(proxyId: string): Promise<ProxyPerformance> {
    const performance: ProxyPerformance = {
      proxyId,
      totalUsage: 0,
      consecutiveFailures: 0,
      health: 'good',
      lastUsed: new Date(),
      blockedUntil: null,
      operationStats: new Map()
    };
    
    this.proxyPerformance.set(proxyId, performance);
    return performance;
  }

  /**
   * الحصول على استراتيجية الدوران
   */
  private getRotationStrategy(accountId: number): RotationStrategy {
    let strategy = this.rotationStrategies.get(accountId);
    
    if (!strategy) {
      strategy = {
        type: 'performance_based',
        currentIndex: 0,
        preferredLocations: ['US', 'GB', 'DE'],
        maxUsagePerHour: 100,
        rotationInterval: 300 // 5 دقائق
      };
      this.rotationStrategies.set(accountId, strategy);
    }
    
    return strategy;
  }

  /**
   * توليد بدائل
   */
  private async generateAlternatives(accountId: number): Promise<ProxyAlternative[]> {
    const alternatives: ProxyAlternative[] = [];
    
    // 1. استخدام بروكسي عام
    alternatives.push({
      type: 'public_proxy',
      description: 'Use public proxy pool',
      reliability: 'low',
      setupTime: 'immediate'
    });
    
    // 2. استخدام VPN
    alternatives.push({
      type: 'vpn',
      description: 'Use VPN connection',
      reliability: 'medium',
      setupTime: '5 minutes'
    });
    
    // 3. الاتصال المباشر (للعمليات منخفضة المخاطر)
    alternatives.push({
      type: 'direct',
      description: 'Direct connection (low risk only)',
      reliability: 'high',
      setupTime: 'immediate'
    });
    
    return alternatives;
  }

  // دول مساعدة
  private initializeLocationData(): void {
    // تهيئة بيانات المواقع
    this.locationAnalysis.set('US', { 
      risk: 'low', 
      speed: 'high', 
      reliability: 'high',
      timezone: 'America/New_York'
    });
    // ... باقي المواقع
  }

  private calculateSuccessRate(performance: ProxyPerformance, operationType: OperationType): number {
    const stats = performance.operationStats.get(operationType);
    if (!stats || stats.count === 0) return 0.8; // افتراضي جيد
    
    return stats.successCount / stats.count;
  }

  private getAverageResponseTime(performance: ProxyPerformance): number {
    let totalTime = 0;
    let totalCount = 0;
    
    for (const stats of performance.operationStats.values()) {
      totalTime += stats.averageResponseTime * stats.count;
      totalCount += stats.count;
    }
    
    return totalCount > 0 ? totalTime / totalCount : 1000; // 1 ثانية افتراضي
  }

  private calculateStability(performance: ProxyPerformance): number {
    // حساب الاستقرار بناءً على تباين أوقات الاستجابة
    // سيتم تنفيذها لاحقاً
    return 0.8;
  }

  private analyzeLocationSuitability(proxy: ProxyConfig, context: ProxyContext): number {
    const location = this.getProxyLocation(proxy);
    const locationData = this.locationAnalysis.get(location);
    
    if (!locationData) return 0.5;
    
    let score = 0.5;
    
    if (locationData.risk === 'low') score += 0.3;
    if (locationData.speed === 'high') score += 0.2;
    if (locationData.reliability === 'high') score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private calculateLoadScore(performance: ProxyPerformance): number {
    // حساب الحمولة الحالية
    const currentLoad = this.getCurrentLoad(performance.proxyId);
    return Math.max(0, 1 - currentLoad);
  }

  private getCurrentLoad(proxyId: string): number {
    // سيتم تنفيذها لاحقاً
    return 0.3;
  }

  private calculatePerformanceConfidence(performance: ProxyPerformance): number {
    // حساب الثقة في أداء البروكسي
    if (performance.totalUsage < 10) return 0.3;
    if (performance.totalUsage < 50) return 0.6;
    if (performance.totalUsage < 200) return 0.8;
    return 0.9;
  }

  private determineExpectedPerformance(score: number): 'excellent' | 'good' | 'medium' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'medium';
    return 'poor';
  }

  private generateProxyRecommendation(score: number, factors: PerformanceFactor[]): string {
    if (score >= 85) return 'HIGHLY_RECOMMENDED';
    if (score >= 70) return 'RECOMMENDED';
    if (score >= 50) return 'ACCEPTABLE';
    return 'NOT_RECOMMENDED';
  }

  private generateProxyReasoning(proxy: ProxyConfig, scores: Map<string, ProxyScore>): string {
    const score = scores.get(proxy.id);
    if (!score) return 'No performance data available';
    
    const topFactors = score.factors
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(f => `${f.type}: ${(f.value * 100).toFixed(1)}%`)
      .join(', ');
    
    return `Performance score: ${score.totalScore.toFixed(1)}/100. Key factors: ${topFactors}`;
  }

  private calculateNextRotation(proxy: ProxyConfig, strategy: RotationStrategy): Date {
    return new Date(Date.now() + strategy.rotationInterval * 1000);
  }

  private getProxyLocation(proxy: ProxyConfig): string {
    // استخراج موقع البروكسي
    // سيتم تنفيذها لاحقاً
    return 'US';
  }

  private getOperationWeight(operationType: string): number {
    const weights: Record<string, number> = {
      'message': 0.2,
      'join_group': 0.3,
      'add_user': 0.3,
      'leave_group': 0.1,
      'extract_members': 0.2,
      'boost_engagement': 0.2
    };
    
    return weights[operationType] || 0.2;
  }

  private async markProxyUnhealthy(proxyId: string): Promise<void> {
    const performance = this.proxyPerformance.get(proxyId);
    if (performance) {
      performance.health = 'poor';
      performance.blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 دقيقة
      this.proxyPerformance.set(proxyId, performance);
    }
  }

  /**
   * الحصول على إحصائيات البروكسي
   */
  getProxyStatistics(accountId: number): ProxyStatistics | null {
    const pool = this.getProxyPool(accountId);
    const strategy = this.getRotationStrategy(accountId);
    
    let totalProxies = pool.proxies.length;
    let healthyProxies = 0;
    let totalUsage = 0;
    let averageResponseTime = 0;

    for (const proxy of pool.proxies) {
      const performance = this.proxyPerformance.get(proxy.id?.toString() || '');
      if (performance) {
        if (performance.health === 'excellent' || performance.health === 'good') {
          healthyProxies++;
        }
        totalUsage += performance.totalUsage;
        averageResponseTime += this.getAverageResponseTime(performance);
      }
    }

    averageResponseTime = totalProxies > 0 ? averageResponseTime / totalProxies : 0;

    return {
      totalProxies,
      healthyProxies,
      healthPercentage: totalProxies > 0 ? (healthyProxies / totalProxies) * 100 : 0,
      totalUsage,
      averageResponseTime,
      rotationStrategy: strategy.type,
      lastUpdated: pool.lastUpdated
    };
  }
}

// التصدير والأنواع
export const proxyIntelligence = ProxyIntelligenceManager.getInstance();

// أنواع البيانات
interface ProxyPerformance {
  proxyId: string;
  totalUsage: number;
  consecutiveFailures: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  lastUsed: Date;
  blockedUntil: Date | null;
  operationStats: Map<string, OperationStats>;
}

interface OperationStats {
  count: number;
  successCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
}

interface ProxyPool {
  accountId: number;
  proxies: ProxyConfig[];
  lastUpdated: Date;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

interface RotationStrategy {
  type: 'performance_based' | 'round_robin' | 'weighted_random' | 'location_based' | 'load_balanced';
  currentIndex: number;
  preferredLocations?: string[];
  maxUsagePerHour: number;
  rotationInterval: number; // بالثواني
}

interface LocationData {
  risk: 'low' | 'medium' | 'high';
  speed: 'low' | 'medium' | 'high';
  reliability: 'low' | 'medium' | 'high';
  timezone: string;
}

interface ProxyContext {
  operationRisk: 'low' | 'medium' | 'high';
  preferredLocation?: string;
  maxResponseTime?: number;
  requiredReliability?: number;
}

interface OptimalProxyResult {
  proxy: ProxyConfig | null;
  reason?: string;
  alternatives?: ProxyAlternative[];
  recommendations?: string[];
  confidence?: number;
  reasoning?: string;
  expectedPerformance?: 'excellent' | 'good' | 'medium' | 'poor';
  nextRotationTime?: Date;
}

interface ProxyAlternative {
  type: string;
  description: string;
  reliability: 'low' | 'medium' | 'high';
  setupTime: string;
}

interface ProxyScore {
  totalScore: number;
  confidence: number;
  expectedPerformance: 'excellent' | 'good' | 'medium' | 'poor';
  factors: PerformanceFactor[];
  recommendation: string;
}

interface PerformanceFactor {
  type: string;
  value: number;
  weight: number;
}

interface ProxyHealthCheck {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

interface ProxyOperationResult {
  success: boolean;
  responseTime?: number;
  error?: string;
}

interface ProxyStatistics {
  totalProxies: number;
  healthyProxies: number;
  healthPercentage: number;
  totalUsage: number;
  averageResponseTime: number;
  rotationStrategy: string;
  lastUpdated: Date;
}

type OperationType = 'message' | 'join_group' | 'add_user' | 'leave_group' | 'extract_members' | 'boost_engagement';
