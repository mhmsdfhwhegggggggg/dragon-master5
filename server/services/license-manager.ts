import { getDb } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { users, licenses, subscriptions, licenseUsageLogs } from '../db/schema';

/**
 * License Management System
 * 
 * Advanced licensing and subscription management for Dragon Telegram Pro
 * Features:
 * - License generation and validation
 * - Subscription management
 * - Activation/deactivation
 * - Security and encryption
 * - Usage tracking
 * - Auto-renewal
 */

export interface License {
  id: number;
  userId: number;
  licenseKey: string;
  type: 'trial' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  createdAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  maxAccounts: number;
  maxMessages: number;
  features: string[];
  hardwareId?: string;
  lastValidated?: Date;
  usageCount: number;
  maxUsage?: number;
  autoRenew: boolean;
  renewalPrice?: number;
}

export interface Subscription {
  id: number;
  licenseId: number;
  plan: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  price: number;
  currency: string;
  autoRenew: boolean;
  nextBillingDate?: Date;
  paymentMethod?: string;
  paymentId?: string;
}

export interface LicenseValidation {
  valid: boolean;
  license?: License;
  subscription?: Subscription;
  errors: string[];
  warnings: string[];
  remainingDays?: number;
  usageRemaining?: number;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private encryptionKey: string;
  private validationCache: Map<string, { result: LicenseValidation; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.encryptionKey = process.env.LICENSE_ENCRYPTION_KEY || 'dragon-telegram-pro-2024-secure-key';
  }

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  /**
   * Generate a new license key
   */
  async generateLicense(
    userId: number,
    type: License['type'],
    durationDays: number,
    maxAccounts: number,
    maxMessages: number,
    features: string[] = [],
    autoRenew: boolean = false,
    renewalPrice?: number
  ): Promise<string> {
    // Generate unique license key
    const licenseKey = this.generateLicenseKey();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Store license in database (would need to create license table)
    // For now, return the generated key
    return licenseKey;
  }

  /**
   * Generate encrypted license key
   */
  private generateLicenseKey(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256')
      .update(`${timestamp}-${random}-${this.encryptionKey}`)
      .digest('hex');
    
    return `DTP-${hash.substring(0, 8).toUpperCase()}-${hash.substring(8, 16).toUpperCase()}-${hash.substring(16, 24).toUpperCase()}`;
  }

  /**
   * Validate license key
   */
  async validateLicense(licenseKey: string, hardwareId?: string): Promise<LicenseValidation> {
    // Check cache first
    const cacheKey = `${licenseKey}-${hardwareId || ''}`;
    const cached = this.validationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    const validation: LicenseValidation = {
      valid: false,
      errors: [],
      warnings: []
    };

    try {
      // Validate license key format
      if (!this.isValidLicenseFormat(licenseKey)) {
        validation.errors.push('Invalid license key format');
        return validation;
      }

      // Get license from database (would need to implement)
      const license = await this.getLicenseFromDatabase(licenseKey);
      
      if (!license) {
        validation.errors.push('License not found');
        return validation;
      }

      validation.license = license;

      // Check license status
      if (license.status === 'inactive') {
        validation.errors.push('License is inactive');
        return validation;
      }

      if (license.status === 'suspended') {
        validation.errors.push('License is suspended');
        return validation;
      }

      if (license.status === 'expired') {
        validation.errors.push('License has expired');
        return validation;
      }

      // Check expiration
      if (license.expiresAt && new Date() > license.expiresAt) {
        validation.errors.push('License has expired');
        return validation;
      }

      // Check hardware binding
      if (license.hardwareId && license.hardwareId !== hardwareId) {
        validation.errors.push('License is bound to different hardware');
        return validation;
      }

      // Check usage limits
      if (license.maxUsage && license.usageCount >= license.maxUsage) {
        validation.errors.push('Usage limit exceeded');
        return validation;
      }

      // Get subscription if exists
      const subscription = await this.getSubscriptionFromDatabase(license.id);
      if (subscription) {
        validation.subscription = subscription;

        // Check subscription
        if (subscription.status !== 'active') {
          validation.errors.push('Subscription is not active');
          return validation;
        }

        if (new Date() > subscription.endDate) {
          validation.errors.push('Subscription has expired');
          return validation;
        }

        // Calculate remaining days
        const remainingDays = Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        validation.remainingDays = remainingDays;

        // Warn about upcoming expiration
        if (remainingDays <= 7) {
          validation.warnings.push(`Subscription expires in ${remainingDays} days`);
        }
      }

      // Calculate remaining usage
      if (license.maxUsage) {
        validation.usageRemaining = license.maxUsage - license.usageCount;
        
        if (validation.usageRemaining <= 10) {
          validation.warnings.push(`Low usage remaining: ${validation.usageRemaining}`);
        }
      }

      // Update last validated timestamp
      await this.updateLastValidated(license.id);

      validation.valid = true;

      // Cache result
      this.validationCache.set(cacheKey, { result: validation, timestamp: Date.now() });

      return validation;

    } catch (error) {
      console.error('License validation error:', error);
      validation.errors.push('Validation failed due to system error');
      return validation;
    }
  }

  /**
   * Check if license key format is valid
   */
  private isValidLicenseFormat(licenseKey: string): boolean {
    const pattern = /^DTP-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/;
    return pattern.test(licenseKey);
  }

  /**
   * Get license from database
   */
  private async getLicenseFromDatabase(licenseKey: string): Promise<License | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select()
        .from(licenses)
        .where(eq(licenses.licenseKey, licenseKey))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }

      const license = result[0];
      return {
        id: license.id,
        userId: license.userId,
        licenseKey: license.licenseKey,
        type: license.type as License['type'],
        status: license.status as License['status'],
        createdAt: license.createdAt,
        activatedAt: license.activatedAt || undefined,
        expiresAt: license.expiresAt || undefined,
        maxAccounts: license.maxAccounts,
        maxMessages: license.maxMessages,
        features: license.features,
        hardwareId: license.hardwareId || undefined,
        lastValidated: license.lastValidated || undefined,
        usageCount: license.usageCount,
        maxUsage: license.maxUsage || undefined,
        autoRenew: license.autoRenew,
        renewalPrice: license.renewalPrice ? Number(license.renewalPrice) : undefined,
      };
    } catch (error) {
      console.error('Error getting license from database:', error);
      return null;
    }
  }

  /**
   * Get subscription from database
   */
  private async getSubscriptionFromDatabase(licenseId: number): Promise<Subscription | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.licenseId, licenseId))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }

      const subscription = result[0];
      return {
        id: subscription.id,
        licenseId: subscription.licenseId,
        plan: subscription.plan as Subscription['plan'],
        status: subscription.status as Subscription['status'],
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        price: Number(subscription.price),
        currency: subscription.currency,
        autoRenew: subscription.autoRenew,
        nextBillingDate: subscription.nextBillingDate || undefined,
        paymentMethod: subscription.paymentMethod || undefined,
        paymentId: subscription.paymentId || undefined,
      };
    } catch (error) {
      console.error('Error getting subscription from database:', error);
      return null;
    }
  }

  /**
   * Update last validated timestamp
   */
  private async updateLastValidated(licenseId: number): Promise<void> {
    // This would update the license's lastValidated field
    // For now, do nothing as placeholder
  }

  /**
   * Activate license
   */
  async activateLicense(licenseKey: string, hardwareId: string): Promise<boolean> {
    try {
      const validation = await this.validateLicense(licenseKey, hardwareId);
      
      if (!validation.valid) {
        return false;
      }

      if (validation.license) {
        // Bind license to hardware
        await this.bindLicenseToHardware(validation.license.id, hardwareId);
        
        // Activate license
        await this.updateLicenseStatus(validation.license.id, 'active');
        
        // Clear cache
        this.clearValidationCache(licenseKey);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('License activation error:', error);
      return false;
    }
  }

  /**
   * Deactivate license
   */
  async deactivateLicense(licenseKey: string): Promise<boolean> {
    try {
      const license = await this.getLicenseFromDatabase(licenseKey);
      
      if (!license) {
        return false;
      }

      await this.updateLicenseStatus(license.id, 'inactive');
      this.clearValidationCache(licenseKey);
      
      return true;
    } catch (error) {
      console.error('License deactivation error:', error);
      return false;
    }
  }

  /**
   * Bind license to hardware
   */
  private async bindLicenseToHardware(licenseId: number, hardwareId: string): Promise<void> {
    // This would update the license's hardwareId field
    // For now, do nothing as placeholder
  }

  /**
   * Update license status
   */
  private async updateLicenseStatus(licenseId: number, status: License['status']): Promise<void> {
    // This would update the license's status field
    // For now, do nothing as placeholder
  }

  /**
   * Track license usage
   */
  async trackUsage(licenseKey: string, action: string, metadata?: any): Promise<void> {
    try {
      const license = await this.getLicenseFromDatabase(licenseKey);
      
      if (!license) {
        return;
      }

      // Increment usage count
      await this.incrementUsageCount(license.id);

      // Log usage
      await this.logUsage(license.id, action, metadata);

      // Clear cache to force revalidation
      this.clearValidationCache(licenseKey);

    } catch (error) {
      console.error('Usage tracking error:', error);
    }
  }

  /**
   * Increment usage count
   */
  private async incrementUsageCount(licenseId: number): Promise<void> {
    // This would increment the license's usageCount field
    // For now, do nothing as placeholder
  }

  /**
   * Log usage
   */
  private async logUsage(licenseId: number, action: string, metadata?: any): Promise<void> {
    // This would log the usage to a usage table
    // For now, do nothing as placeholder
  }

  /**
   * Create subscription
   */
  async createSubscription(
    licenseId: number,
    plan: Subscription['plan'],
    price: number,
    currency: string = 'USD',
    autoRenew: boolean = true
  ): Promise<number> {
    const startDate = new Date();
    const endDate = new Date();

    switch (plan) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
    }

    // Create subscription in database (would need to implement)
    // For now, return a mock ID
    return Date.now();
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: number): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionFromDatabase(subscriptionId);
      
      if (!subscription) {
        return false;
      }

      // Calculate new end date
      const newEndDate = new Date(subscription.endDate);
      
      switch (subscription.plan) {
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case 'quarterly':
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case 'yearly':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        case 'lifetime':
          newEndDate.setFullYear(newEndDate.getFullYear() + 100);
          break;
      }

      // Update subscription (would need to implement)
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Subscription renewal error:', error);
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: number): Promise<boolean> {
    try {
      // Update subscription status to cancelled (would need to implement)
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return false;
    }
  }

  /**
   * Get license analytics
   */
  async getLicenseAnalytics(): Promise<{
    totalLicenses: number;
    activeLicenses: number;
    expiredLicenses: number;
    totalRevenue: number;
    monthlyRevenue: number;
    planDistribution: Record<string, number>;
    expiringSoon: number;
  }> {
    // This would calculate analytics from the database
    // For now, return mock data
    return {
      totalLicenses: 150,
      activeLicenses: 120,
      expiredLicenses: 30,
      totalRevenue: 45000,
      monthlyRevenue: 7500,
      planDistribution: {
        trial: 20,
        basic: 50,
        premium: 60,
        enterprise: 20
      },
      expiringSoon: 15
    };
  }

  /**
   * Clear validation cache
   */
  private clearValidationCache(licenseKey: string): void {
    const keysToDelete = Array.from(this.validationCache.keys())
      .filter(key => key.startsWith(licenseKey));
    
    keysToDelete.forEach(key => this.validationCache.delete(key));
  }

  /**
   * Generate hardware ID
   */
  static generateHardwareId(): string {
    try {
      const os = require('os');
      const cpus = os.cpus();
      const networkInterfaces = os.networkInterfaces();
      
      // Create hardware fingerprint
      const components = [
        cpus[0]?.model || '',
        cpus.length.toString(),
        os.totalmem().toString(),
        os.hostname(),
        Object.values(networkInterfaces)
          .flat()
          .filter((iface: any) => iface && !iface.internal)
          .map((iface: any) => iface?.mac)
          .filter(Boolean)
          .join(',')
      ].join('|');

      return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
    } catch (error) {
      console.error('Error generating hardware ID:', error);
      // Fallback to random ID
      return crypto.randomBytes(16).toString('hex');
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }
}

export const licenseManager = LicenseManager.getInstance();
