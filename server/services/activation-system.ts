import { licenseManager } from './license-manager';
import { getDb } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { licenses, subscriptions } from '../db/schema';
import crypto from 'crypto';

/**
 * Activation System
 * 
 * Advanced activation and deactivation system for Dragon Telegram Pro
 * Features:
 * - Hardware binding
 * - Online activation
 * - Offline activation
 * - Automatic renewal
 * - Security checks
 */

export interface ActivationRequest {
  licenseKey: string;
  hardwareId: string;
  userEmail?: string;
  activationCode?: string;
  offlineMode?: boolean;
}

export interface ActivationResponse {
  success: boolean;
  activated: boolean;
  message: string;
  license?: any;
  subscription?: any;
  expiresAt?: Date;
  features?: string[];
  limitations?: {
    maxAccounts: number;
    maxMessages: number;
    maxUsage?: number;
  };
  activationId?: string;
}

export class ActivationSystem {
  private static instance: ActivationSystem;
  private activationCache: Map<string, { response: ActivationResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): ActivationSystem {
    if (!ActivationSystem.instance) {
      ActivationSystem.instance = new ActivationSystem();
    }
    return ActivationSystem.instance;
  }

  /**
   * Activate license
   */
  async activateLicense(request: ActivationRequest): Promise<ActivationResponse> {
    try {
      // Check cache first
      const cacheKey = `${request.licenseKey}-${request.hardwareId}`;
      const cached = this.activationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.response;
      }

      // Validate license first
      const validation = await licenseManager.validateLicense(request.licenseKey, request.hardwareId);
      
      if (!validation.valid) {
        const response: ActivationResponse = {
          success: false,
          activated: false,
          message: `License validation failed: ${validation.errors.join(', ')}`,
        };
        
        this.activationCache.set(cacheKey, { response, timestamp: Date.now() });
        return response;
      }

      // Check if already activated
      if (validation.license?.hardwareId === request.hardwareId && validation.license?.status === 'active') {
        const response: ActivationResponse = {
          success: true,
          activated: true,
          message: 'License already activated on this hardware',
          license: validation.license,
          subscription: validation.subscription,
          expiresAt: validation.license?.expiresAt,
          features: validation.license?.features,
          limitations: {
            maxAccounts: validation.license?.maxAccounts || 1,
            maxMessages: validation.license?.maxMessages || 1000,
            maxUsage: validation.license?.maxUsage,
          },
        };
        
        this.activationCache.set(cacheKey, { response, timestamp: Date.now() });
        return response;
      }

      // Perform activation
      const activationSuccess = await licenseManager.activateLicense(request.licenseKey, request.hardwareId);
      
      if (!activationSuccess) {
        const response: ActivationResponse = {
          success: false,
          activated: false,
          message: 'Failed to activate license',
        };
        
        this.activationCache.set(cacheKey, { response, timestamp: Date.now() });
        return response;
      }

      // Get updated license info
      const updatedValidation = await licenseManager.validateLicense(request.licenseKey, request.hardwareId);
      
      const response: ActivationResponse = {
        success: true,
        activated: true,
        message: 'License activated successfully',
        license: updatedValidation.license,
        subscription: updatedValidation.subscription,
        expiresAt: updatedValidation.license?.expiresAt,
        features: updatedValidation.license?.features,
        limitations: {
          maxAccounts: updatedValidation.license?.maxAccounts || 1,
          maxMessages: updatedValidation.license?.maxMessages || 1000,
          maxUsage: updatedValidation.license?.maxUsage,
        },
        activationId: this.generateActivationId(),
      };

      // Cache successful activation
      this.activationCache.set(cacheKey, { response, timestamp: Date.now() });

      return response;

    } catch (error) {
      console.error('Activation error:', error);
      return {
        success: false,
        activated: false,
        message: 'Activation failed due to system error',
      };
    }
  }

  /**
   * Deactivate license
   */
  async deactivateLicense(licenseKey: string, hardwareId: string): Promise<ActivationResponse> {
    try {
      // Validate license first
      const validation = await licenseManager.validateLicense(licenseKey, hardwareId);
      
      if (!validation.valid) {
        return {
          success: false,
          activated: false,
          message: `License validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Check if license is bound to this hardware
      if (validation.license?.hardwareId !== hardwareId) {
        return {
          success: false,
          activated: false,
          message: 'License is not bound to this hardware',
        };
      }

      // Deactivate license
      const deactivationSuccess = await licenseManager.deactivateLicense(licenseKey);
      
      if (!deactivationSuccess) {
        return {
          success: false,
          activated: false,
          message: 'Failed to deactivate license',
        };
      }

      // Clear cache
      const cacheKey = `${licenseKey}-${hardwareId}`;
      this.activationCache.delete(cacheKey);

      return {
        success: true,
        activated: false,
        message: 'License deactivated successfully',
      };

    } catch (error) {
      console.error('Deactivation error:', error);
      return {
        success: false,
        activated: false,
        message: 'Deactivation failed due to system error',
      };
    }
  }

  /**
   * Check activation status
   */
  async checkActivationStatus(licenseKey: string, hardwareId: string): Promise<ActivationResponse> {
    try {
      // Check cache first
      const cacheKey = `${licenseKey}-${hardwareId}`;
      const cached = this.activationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.response;
      }

      // Validate license
      const validation = await licenseManager.validateLicense(licenseKey, hardwareId);
      
      if (!validation.valid) {
        const response: ActivationResponse = {
          success: false,
          activated: false,
          message: `License validation failed: ${validation.errors.join(', ')}`,
        };
        
        this.activationCache.set(cacheKey, { response, timestamp: Date.now() });
        return response;
      }

      const isActive = validation.license?.status === 'active' && 
                      validation.license?.hardwareId === hardwareId;

      const response: ActivationResponse = {
        success: true,
        activated: isActive,
        message: isActive ? 'License is active' : 'License is not active',
        license: validation.license,
        subscription: validation.subscription,
        expiresAt: validation.license?.expiresAt,
        features: validation.license?.features,
        limitations: {
          maxAccounts: validation.license?.maxAccounts || 1,
          maxMessages: validation.license?.maxMessages || 1000,
          maxUsage: validation.license?.maxUsage,
        },
      };

      this.activationCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;

    } catch (error) {
      console.error('Status check error:', error);
      return {
        success: false,
        activated: false,
        message: 'Status check failed due to system error',
      };
    }
  }

  /**
   * Generate activation file for offline activation
   */
  async generateOfflineActivationFile(licenseKey: string, hardwareId: string): Promise<string | null> {
    try {
      const activation = await this.activateLicense({ licenseKey, hardwareId });
      
      if (!activation.success) {
        return null;
      }

      const activationData = {
        licenseKey,
        hardwareId,
        activationId: activation.activationId,
        expiresAt: activation.expiresAt,
        features: activation.features,
        limitations: activation.limitations,
        timestamp: Date.now(),
        signature: this.generateActivationSignature(licenseKey, hardwareId),
      };

      // Encrypt activation data
      const encryptedData = licenseManager.encrypt(JSON.stringify(activationData));
      
      return encryptedData;

    } catch (error) {
      console.error('Offline activation file generation error:', error);
      return null;
    }
  }

  /**
   * Activate from offline file
   */
  async activateFromOfflineFile(encryptedData: string, hardwareId: string): Promise<ActivationResponse> {
    try {
      // Decrypt activation data
      const activationData = JSON.parse(licenseManager.decrypt(encryptedData));
      
      // Verify hardware ID
      if (activationData.hardwareId !== hardwareId) {
        return {
          success: false,
          activated: false,
          message: 'Hardware ID mismatch',
        };
      }

      // Verify signature
      const expectedSignature = this.generateActivationSignature(activationData.licenseKey, hardwareId);
      if (activationData.signature !== expectedSignature) {
        return {
          success: false,
          activated: false,
          message: 'Invalid activation signature',
        };
      }

      // Check if activation is expired
      if (activationData.expiresAt && new Date() > new Date(activationData.expiresAt)) {
        return {
          success: false,
          activated: false,
          message: 'Offline activation has expired',
        };
      }

      // Activate license
      return await this.activateLicense({
        licenseKey: activationData.licenseKey,
        hardwareId,
      });

    } catch (error) {
      console.error('Offline activation error:', error);
      return {
        success: false,
        activated: false,
        message: 'Offline activation failed',
      };
    }
  }

  /**
   * Generate activation ID
   */
  private generateActivationId(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  /**
   * Generate activation signature
   */
  private generateActivationSignature(licenseKey: string, hardwareId: string): string {
    const data = `${licenseKey}-${hardwareId}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Clear activation cache
   */
  clearCache(licenseKey?: string, hardwareId?: string): void {
    if (licenseKey && hardwareId) {
      const cacheKey = `${licenseKey}-${hardwareId}`;
      this.activationCache.delete(cacheKey);
    } else {
      this.activationCache.clear();
    }
  }

  /**
   * Get activation statistics
   */
  async getActivationStats(): Promise<{
    totalActivations: number;
    activeActivations: number;
    expiredActivations: number;
    hardwareChanges: number;
    recentActivations: number;
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return {
          totalActivations: 0,
          activeActivations: 0,
          expiredActivations: 0,
          hardwareChanges: 0,
          recentActivations: 0,
        };
      }

      // This would query activation logs from database
      // For now, return mock data
      return {
        totalActivations: 450,
        activeActivations: 320,
        expiredActivations: 130,
        hardwareChanges: 25,
        recentActivations: 45,
      };

    } catch (error) {
      console.error('Activation stats error:', error);
      return {
        totalActivations: 0,
        activeActivations: 0,
        expiredActivations: 0,
        hardwareChanges: 0,
        recentActivations: 0,
      };
    }
  }

  /**
   * Check for automatic renewal
   */
  async checkAutomaticRenewal(licenseKey: string): Promise<boolean> {
    try {
      const validation = await licenseManager.validateLicense(licenseKey);
      
      if (!validation.valid || !validation.subscription) {
        return false;
      }

      const subscription = validation.subscription;
      
      // Check if auto-renew is enabled and subscription is expiring soon
      if (!subscription.autoRenew || !subscription.nextBillingDate) {
        return false;
      }

      const daysUntilBilling = Math.ceil(
        (subscription.nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Auto-renew if within 7 days of billing
      return daysUntilBilling <= 7;

    } catch (error) {
      console.error('Auto-renewal check error:', error);
      return false;
    }
  }

  /**
   * Process automatic renewal
   */
  async processAutomaticRenewal(licenseKey: string): Promise<boolean> {
    try {
      const validation = await licenseManager.validateLicense(licenseKey);
      
      if (!validation.valid || !validation.subscription) {
        return false;
      }

      // Renew subscription
      const renewalSuccess = await licenseManager.renewSubscription(validation.subscription.id);
      
      if (renewalSuccess) {
        // Clear cache to force revalidation
        this.clearCache();
        return true;
      }

      return false;

    } catch (error) {
      console.error('Auto-renewal processing error:', error);
      return false;
    }
  }
}

export const activationSystem = ActivationSystem.getInstance();
