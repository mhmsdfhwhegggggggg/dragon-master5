/**
 * License Manager - Basic license management system
 * Handles license validation and activation
 */

export interface License {
  id: string;
  key: string;
  type: 'trial' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'suspended' | 'pending';
  createdAt: Date;
  expiresAt: Date;
  maxAccounts: number;
  maxOperations: number;
  features: string[];
  hardwareId?: string;
  activatedAt?: Date;
  lastValidated?: Date;
}

export interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  reason?: string;
  daysRemaining?: number;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private licenses: Map<string, License> = new Map();
  private currentLicense: License | null = null;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!this.instance) {
      this.instance = new LicenseManager();
    }
    return this.instance;
  }

  /**
   * Generate license key
   */
  generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += '-';
    }
    return key;
  }

  /**
   * Create license
   */
  createLicense(type: License['type'], durationDays: number): License {
    const license: License = {
      id: Date.now().toString(),
      key: this.generateLicenseKey(),
      type,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      maxAccounts: this.getMaxAccountsForType(type),
      maxOperations: this.getMaxOperationsForType(type),
      features: this.getFeaturesForType(type)
    };

    this.licenses.set(license.key, license);
    return license;
  }

  /**
   * Activate license
   */
  activateLicense(key: string, hardwareId?: string): LicenseValidationResult {
    const license = this.licenses.get(key);
    if (!license) {
      return { valid: false, reason: 'License not found' };
    }

    if (license.status === 'expired') {
      return { valid: false, reason: 'License expired' };
    }

    if (license.status === 'suspended') {
      return { valid: false, reason: 'License suspended' };
    }

    // Update license
    license.status = 'active';
    license.activatedAt = new Date();
    license.lastValidated = new Date();
    if (hardwareId) {
      license.hardwareId = hardwareId;
    }

    this.currentLicense = license;
    this.licenses.set(key, license);

    const daysRemaining = Math.ceil(
      (license.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    return {
      valid: true,
      license,
      daysRemaining: Math.max(0, daysRemaining)
    };
  }

  /**
   * Validate current license
   */
  validateLicense(hardwareId?: string): LicenseValidationResult {
    if (!this.currentLicense) {
      return { valid: false, reason: 'No license activated' };
    }

    const license = this.currentLicense;

    // Check expiration
    if (license.expiresAt < new Date()) {
      license.status = 'expired';
      return { valid: false, reason: 'License expired' };
    }

    // Check hardware ID if provided
    if (hardwareId && license.hardwareId && license.hardwareId !== hardwareId) {
      return { valid: false, reason: 'Hardware ID mismatch' };
    }

    // Update last validated
    license.lastValidated = new Date();

    const daysRemaining = Math.ceil(
      (license.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    return {
      valid: true,
      license,
      daysRemaining: Math.max(0, daysRemaining)
    };
  }

  /**
   * Get current license info
   */
  getCurrentLicense(): License | null {
    return this.currentLicense;
  }

  /**
   * Check if feature is available
   */
  hasFeature(feature: string): boolean {
    if (!this.currentLicense) return false;
    return this.currentLicense.features.includes(feature);
  }

  private getMaxAccountsForType(type: License['type']): number {
    switch (type) {
      case 'trial': return 5;
      case 'basic': return 50;
      case 'pro': return 200;
      case 'enterprise': return 1000;
      default: return 5;
    }
  }

  private getMaxOperationsForType(type: License['type']): number {
    switch (type) {
      case 'trial': return 100;
      case 'basic': return 1000;
      case 'pro': return 10000;
      case 'enterprise': return 100000;
      default: return 100;
    }
  }

  private getFeaturesForType(type: License['type']): string[] {
    const baseFeatures = ['dashboard', 'account_management'];
    
    switch (type) {
      case 'trial':
        return [...baseFeatures, 'basic_extraction'];
      case 'basic':
        return [...baseFeatures, 'extraction', 'bulk_operations'];
      case 'pro':
        return [...baseFeatures, 'extraction', 'bulk_operations', 'advanced_filters', 'anti_ban'];
      case 'enterprise':
        return [...baseFeatures, 'extraction', 'bulk_operations', 'advanced_filters', 'anti_ban', 'api_access', 'white_label'];
      default:
        return baseFeatures;
    }
  }
}

export const licenseManager = LicenseManager.getInstance();
