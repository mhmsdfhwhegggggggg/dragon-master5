import { getDb } from '../db';
import { eq, and, desc, sql, lte, gte } from 'drizzle-orm';
import crypto from 'crypto';
import { appPermissions, permissionUsageLogs } from '../../drizzle/schema-sqlite';

/**
 * Permission Management System
 * 
 * نظام إدارة التصاريح للمطور
 * - التحكم بمن يمكنه استخدام التطبيق
 * - تحديد مدة الاستخدام
 * - تعليق وإلغاء التصاريح
 * - تتبع الاستخدام
 */

export type AppPermission = typeof appPermissions.$inferSelect;
export type InsertAppPermission = typeof appPermissions.$inferInsert;

export interface PermissionValidation {
  valid: boolean;
  permission?: AppPermission;
  errors: string[];
  warnings: string[];
  remainingDays?: number;
  remainingMessages?: number;
  remainingOperations?: number;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private validationCache: Map<string, { result: PermissionValidation; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Generate a new permission key
   */
  generatePermissionKey(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `DRG-${timestamp.toUpperCase()}-${random.slice(0, 4)}-${random.slice(4, 8)}`;
  }

  /**
   * Create a new permission
   */
  async createPermission(params: {
    deviceId: string;
    deviceName?: string;
    permissionType?: 'trial' | 'basic' | 'premium' | 'unlimited';
    durationDays?: number;
    maxAccounts?: number;
    maxMessagesPerDay?: number;
    maxOperationsPerDay?: number;
    features?: string[];
    notes?: string;
  }): Promise<{ success: boolean; permission?: any; error?: string }> {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, error: 'Database not available' };
      }

      const permissionKey = this.generatePermissionKey();
      const now = new Date();
      const expiresAt = params.durationDays 
        ? new Date(now.getTime() + params.durationDays * 24 * 60 * 60 * 1000)
        : null;

      // Set limits based on permission type
      const limits = this.getLimitsByType(params.permissionType || 'trial');

      const [permission] = await db.insert(appPermissions).values({
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        permissionKey,
        status: 'active',
        permissionType: params.permissionType || 'trial',
        maxAccounts: params.maxAccounts || limits.maxAccounts,
        maxMessagesPerDay: params.maxMessagesPerDay || limits.maxMessagesPerDay,
        maxOperationsPerDay: params.maxOperationsPerDay || limits.maxOperationsPerDay,
        features: JSON.stringify(params.features || limits.features),
        expiresAt,
        activatedAt: now,
        notes: params.notes,
      }).returning();

      return { success: true, permission };
    } catch (error) {
      console.error('Failed to create permission:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get limits by permission type
   */
  private getLimitsByType(type: string): {
    maxAccounts: number;
    maxMessagesPerDay: number;
    maxOperationsPerDay: number;
    features: string[];
  } {
    switch (type) {
      case 'trial':
        return {
          maxAccounts: 1,
          maxMessagesPerDay: 50,
          maxOperationsPerDay: 5,
          features: ['extraction', 'basic_messaging'],
        };
      case 'basic':
        return {
          maxAccounts: 3,
          maxMessagesPerDay: 200,
          maxOperationsPerDay: 20,
          features: ['extraction', 'messaging', 'bulk_ops'],
        };
      case 'premium':
        return {
          maxAccounts: 10,
          maxMessagesPerDay: 1000,
          maxOperationsPerDay: 100,
          features: ['extraction', 'messaging', 'bulk_ops', 'anti_ban', 'proxies', 'analytics'],
        };
      case 'unlimited':
        return {
          maxAccounts: 999,
          maxMessagesPerDay: 99999,
          maxOperationsPerDay: 99999,
          features: ['*'], // All features
        };
      default:
        return {
          maxAccounts: 1,
          maxMessagesPerDay: 50,
          maxOperationsPerDay: 5,
          features: ['extraction'],
        };
    }
  }

  /**
   * Validate permission
   */
  async validatePermission(permissionKey: string, deviceId?: string): Promise<PermissionValidation> {
    // Check cache
    const cacheKey = `${permissionKey}-${deviceId || ''}`;
    const cached = this.validationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    const validation: PermissionValidation = {
      valid: false,
      errors: [],
      warnings: [],
    };

    try {
      const db = await getDb();
      if (!db) {
        validation.errors.push('Database not available');
        return validation;
      }

      const [permission] = await db.select()
        .from(appPermissions)
        .where(eq(appPermissions.permissionKey, permissionKey))
        .limit(1);

      if (!permission) {
        validation.errors.push('Permission not found');
        return validation;
      }

      validation.permission = permission;

      // Check device binding
      if (deviceId && permission.deviceId !== deviceId) {
        validation.errors.push('Permission bound to different device');
        return validation;
      }

      // Check status
      if (permission.status === 'suspended') {
        validation.errors.push(`Permission suspended: ${permission.suspendReason || 'No reason provided'}`);
        return validation;
      }

      if (permission.status === 'revoked') {
        validation.errors.push('Permission has been revoked');
        return validation;
      }

      if (permission.status === 'expired') {
        validation.errors.push('Permission has expired');
        return validation;
      }

      // Check expiration
      if (permission.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(permission.expiresAt);
        
        if (now > expiresAt) {
          // Update status to expired
          await db.update(appPermissions)
            .set({ status: 'expired' })
            .where(eq(appPermissions.id, permission.id));
          
          validation.errors.push('Permission has expired');
          return validation;
        }

        // Calculate remaining days
        const remainingMs = expiresAt.getTime() - now.getTime();
        validation.remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

        if (validation.remainingDays <= 3) {
          validation.warnings.push(`Permission expires in ${validation.remainingDays} days`);
        }
      }

      // Update last used
      await db.update(appPermissions)
        .set({ 
          lastUsedAt: new Date(),
          usageCount: sql`${appPermissions.usageCount} + 1`
        })
        .where(eq(appPermissions.id, permission.id));

      validation.valid = true;

      // Cache result
      this.validationCache.set(cacheKey, { result: validation, timestamp: Date.now() });

      return validation;
    } catch (error) {
      console.error('Permission validation error:', error);
      validation.errors.push('Validation failed');
      return validation;
    }
  }

  /**
   * Suspend permission
   */
  async suspendPermission(permissionId: number, reason: string): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      await db.update(appPermissions)
        .set({
          status: 'suspended',
          suspendedAt: new Date(),
          suspendReason: reason,
        })
        .where(eq(appPermissions.id, permissionId));

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Failed to suspend permission:', error);
      return false;
    }
  }

  /**
   * Activate suspended permission
   */
  async activatePermission(permissionId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      await db.update(appPermissions)
        .set({
          status: 'active',
          suspendedAt: null,
          suspendReason: null,
        })
        .where(eq(appPermissions.id, permissionId));

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Failed to activate permission:', error);
      return false;
    }
  }

  /**
   * Revoke permission
   */
  async revokePermission(permissionId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      await db.update(appPermissions)
        .set({ status: 'revoked' })
        .where(eq(appPermissions.id, permissionId));

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      return false;
    }
  }

  /**
   * Extend permission duration
   */
  async extendPermission(permissionId: number, additionalDays: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      const [permission] = await db.select()
        .from(appPermissions)
        .where(eq(appPermissions.id, permissionId))
        .limit(1);

      if (!permission) return false;

      const currentExpiry = permission.expiresAt ? new Date(permission.expiresAt) : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);

      await db.update(appPermissions)
        .set({
          expiresAt: newExpiry,
          status: 'active', // Reactivate if expired
        })
        .where(eq(appPermissions.id, permissionId));

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Failed to extend permission:', error);
      return false;
    }
  }

  /**
   * Update permission limits
   */
  async updatePermissionLimits(permissionId: number, limits: {
    maxAccounts?: number;
    maxMessagesPerDay?: number;
    maxOperationsPerDay?: number;
    permissionType?: string;
  }): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      await db.update(appPermissions)
        .set(limits)
        .where(eq(appPermissions.id, permissionId));

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Failed to update permission limits:', error);
      return false;
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<AppPermission[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      return await db.select()
        .from(appPermissions)
        .orderBy(desc(appPermissions.createdAt));
    } catch (error) {
      console.error('Failed to get permissions:', error);
      return [];
    }
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: number): Promise<AppPermission | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const [permission] = await db.select()
        .from(appPermissions)
        .where(eq(appPermissions.id, id))
        .limit(1);

      return permission || null;
    } catch (error) {
      console.error('Failed to get permission:', error);
      return null;
    }
  }

  /**
   * Get permission by device ID
   */
  async getPermissionByDeviceId(deviceId: string): Promise<AppPermission | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const [permission] = await db.select()
        .from(appPermissions)
        .where(eq(appPermissions.deviceId, deviceId))
        .limit(1);

      return permission || null;
    } catch (error) {
      console.error('Failed to get permission:', error);
      return null;
    }
  }

  /**
   * Delete permission
   */
  async deletePermission(permissionId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      await db.delete(appPermissions)
        .where(eq(appPermissions.id, permissionId));

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Failed to delete permission:', error);
      return false;
    }
  }

  /**
   * Get permission statistics
   */
  async getPermissionStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    expired: number;
    revoked: number;
    trial: number;
    basic: number;
    premium: number;
    unlimited: number;
    expiringSoon: number;
    recentlyActive: number;
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return {
          total: 0, active: 0, suspended: 0, expired: 0, revoked: 0,
          trial: 0, basic: 0, premium: 0, unlimited: 0,
          expiringSoon: 0, recentlyActive: 0,
        };
      }

      const permissions = await db.select().from(appPermissions);
      
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return {
        total: permissions.length,
        active: permissions.filter(p => p.status === 'active').length,
        suspended: permissions.filter(p => p.status === 'suspended').length,
        expired: permissions.filter(p => p.status === 'expired').length,
        revoked: permissions.filter(p => p.status === 'revoked').length,
        trial: permissions.filter(p => p.permissionType === 'trial').length,
        basic: permissions.filter(p => p.permissionType === 'basic').length,
        premium: permissions.filter(p => p.permissionType === 'premium').length,
        unlimited: permissions.filter(p => p.permissionType === 'unlimited').length,
        expiringSoon: permissions.filter(p => 
          p.expiresAt && new Date(p.expiresAt) <= threeDaysFromNow && new Date(p.expiresAt) > now
        ).length,
        recentlyActive: permissions.filter(p => 
          p.lastUsedAt && new Date(p.lastUsedAt) >= oneDayAgo
        ).length,
      };
    } catch (error) {
      console.error('Failed to get permission stats:', error);
      return {
        total: 0, active: 0, suspended: 0, expired: 0, revoked: 0,
        trial: 0, basic: 0, premium: 0, unlimited: 0,
        expiringSoon: 0, recentlyActive: 0,
      };
    }
  }

  /**
   * Log permission usage
   */
  async logUsage(permissionId: number, action: string, details?: any, ipAddress?: string): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(permissionUsageLogs).values({
        permissionId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      });
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  }

  /**
   * Clear validation cache
   */
  private clearCache(): void {
    this.validationCache.clear();
  }
}

export const permissionManager = PermissionManager.getInstance();
