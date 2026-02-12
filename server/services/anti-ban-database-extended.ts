import * as db from "../db";
import { eq, and, desc } from "drizzle-orm";

/**
 * Extended Anti-Ban Database Integration
 * 
 * Adds missing database functions for the Anti-Ban system
 * This extends the existing db.ts with Anti-Ban specific operations
 */

// Extended database functions for Anti-Ban system
export class AntiBanDatabaseExtended {
  private static instance: AntiBanDatabaseExtended;

  private constructor() {}

  static getInstance(): AntiBanDatabaseExtended {
    if (!AntiBanDatabaseExtended.instance) {
      AntiBanDatabaseExtended.instance = new AntiBanDatabaseExtended();
    }
    return AntiBanDatabaseExtended.instance;
  }

  /**
   * Create operation result record
   */
  async createOperationResult(data: {
    accountId: number;
    operationType: string;
    targetCount: number;
    success: boolean;
    duration: number;
    actualDelay: number;
    responseTime: number;
    proxyUsed?: number;
    errorType?: string;
    errorMessage?: string;
    timestamp: Date;
  }): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      // Use activityLogs table as operation results storage
      const result = await database
        .insert(db.activityLogs)
        .values({
          accountId: data.accountId,
          action: data.operationType,
          status: data.success ? 'success' : 'failed',
          details: JSON.stringify({
            targetCount: data.targetCount,
            duration: data.duration,
            actualDelay: data.actualDelay,
            responseTime: data.responseTime,
            proxyUsed: data.proxyUsed,
            errorType: data.errorType,
            errorMessage: data.errorMessage,
          }),
          timestamp: data.timestamp,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to create operation result:", error);
      throw error;
    }
  }

  /**
   * Get operation results for an account
   */
  async getOperationResults(accountId: number, since?: Date): Promise<any[]> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      let query = database
        .select()
        .from(db.activityLogs)
        .where(eq(db.activityLogs.accountId, accountId));

      if (since) {
        query = query.where(and(
          eq(db.activityLogs.accountId, accountId),
          db.activityLogs.timestamp.gte(since)
        ));
      }

      return await query.orderBy(desc(db.activityLogs.timestamp));
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get operation results:", error);
      throw error;
    }
  }

  /**
   * Get recent operation results
   */
  async getRecentOperationResults(limit: number): Promise<any[]> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      return await database
        .select()
        .from(db.activityLogs)
        .orderBy(desc(db.activityLogs.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get recent operation results:", error);
      throw error;
    }
  }

  /**
   * Create rate limit tracking
   */
  async createRateLimitTracking(data: {
    accountId: number;
    actionType: string;
    count: number;
    resetAt: Date;
  }): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      // Use statistics table for rate limiting
      const result = await database
        .insert(db.statistics)
        .values({
          accountId: data.accountId,
          date: new Date(),
          // Map to available fields
          messagesSent: data.actionType === 'message' ? data.count : 0,
          messagesFailed: data.actionType === 'message' && data.count === 0 ? 1 : 0,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to create rate limit tracking:", error);
      throw error;
    }
  }

  /**
   * Get rate limit tracking
   */
  async getRateLimitTracking(accountId: number, actionType: string): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await database
        .select()
        .from(db.statistics)
        .where(and(
          eq(db.statistics.accountId, accountId),
          db.statistics.date.gte(today)
        ))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get rate limit tracking:", error);
      throw error;
    }
  }

  /**
   * Update rate limit tracking
   */
  async updateRateLimitTracking(id: number, data: { count: number }): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      const result = await database
        .update(db.statistics)
        .set({
          messagesSent: data.count,
          updatedAt: new Date(),
        })
        .where(eq(db.statistics.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to update rate limit tracking:", error);
      throw error;
    }
  }

  /**
   * Get all telegram accounts
   */
  async getAllTelegramAccounts(): Promise<any[]> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      return await database.select().from(db.telegramAccounts);
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get all telegram accounts:", error);
      throw error;
    }
  }

  /**
   * Get telegram account by ID
   */
  async getTelegramAccount(accountId: number): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      const result = await database
        .select()
        .from(db.telegramAccounts)
        .where(eq(db.telegramAccounts.id, accountId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get telegram account:", error);
      throw error;
    }
  }

  /**
   * Update telegram account
   */
  async updateTelegramAccount(accountId: number, data: {
    warmingLevel?: number;
    messagesSentToday?: number;
    lastActivityAt?: Date;
    isRestricted?: boolean;
    restrictionReason?: string | null;
  }): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      const result = await database
        .update(db.telegramAccounts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(db.telegramAccounts.id, accountId))
        .returning();

      return result[0];
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to update telegram account:", error);
      throw error;
    }
  }

  /**
   * Get proxy config by ID
   */
  async getProxyConfig(proxyId: number): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      const result = await database
        .select()
        .from(db.proxyConfigs)
        .where(eq(db.proxyConfigs.id, proxyId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get proxy config:", error);
      throw error;
    }
  }

  /**
   * Get all proxy configs
   */
  async getAllProxyConfigs(): Promise<any[]> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      return await database.select().from(db.proxyConfigs);
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to get all proxy configs:", error);
      throw error;
    }
  }

  /**
   * Update proxy config
   */
  async updateProxyConfig(proxyId: number, data: {
    lastUsedAt?: Date;
  }): Promise<any> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      const result = await database
        .update(db.proxyConfigs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(db.proxyConfigs.id, proxyId))
        .returning();

      return result[0];
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to update proxy config:", error);
      throw error;
    }
  }

  /**
   * Delete old operation results
   */
  async deleteOldOperationResults(cutoffDate: Date): Promise<void> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      await database
        .delete(db.activityLogs)
        .where(db.activityLogs.timestamp.lt(cutoffDate));
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to delete old operation results:", error);
      throw error;
    }
  }

  /**
   * Delete old rate limit tracking
   */
  async deleteOldRateLimitTracking(cutoffDate: Date): Promise<void> {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    try {
      await database
        .delete(db.statistics)
        .where(db.statistics.date.lt(cutoffDate));
    } catch (error) {
      console.error("[Anti-Ban DB] Failed to delete old rate limit tracking:", error);
      throw error;
    }
  }
}

export const antiBanDatabaseExtended = AntiBanDatabaseExtended.getInstance();
