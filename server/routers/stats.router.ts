import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Statistics Router
 * Handles analytics and reporting
 */
export const statsRouter = router({
  /**
   * Get account statistics for a specific date
   */
  getDailyStats: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        date: z.string(), // YYYY-MM-DD format
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const stats = await db.getOrCreateStatistics(input.accountId, input.date);

        return {
          success: true,
          stats: {
            date: stats.date,
            messagesSent: stats.messagesSent || 0,
            messagesFailed: stats.errors || 0, // Schema uses 'errors'
            membersExtracted: 0, // Not in daily stats yet, keeping 0
            groupsJoined: 0,
            groupsLeft: 0,
            usersAdded: stats.membersAdded || 0, // Schema uses 'membersAdded'
            successRate: ((stats.messagesSent || 0) / ((stats.messagesSent || 0) + (stats.errors || 0) || 1)) * 100,
          },
        };
      } catch (error) {
        console.error("Failed to get daily stats:", error);
        throw new Error("Failed to get daily stats");
      }
    }),

  /**
   * Get today's statistics
   */
  getTodayStats: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const today = new Date().toISOString().split("T")[0];
        const stats = await db.getOrCreateStatistics(input.accountId, today);

        return {
          success: true,
          stats: {
            date: stats.date,
            messagesSent: stats.messagesSent || 0,
            messagesFailed: stats.errors || 0,
            membersExtracted: 0,
            groupsJoined: 0,
            groupsLeft: 0,
            usersAdded: stats.membersAdded || 0,
            successRate: ((stats.messagesSent || 0) / ((stats.messagesSent || 0) + (stats.errors || 0) || 1)) * 100,
            accountStatus: {
              messagesSentToday: account.messagesSentToday,
              dailyLimit: account.dailyLimit,
              warmingLevel: account.warmingLevel,
              isRestricted: account.isRestricted,
            },
          },
        };
      } catch (error) {
        console.error("Failed to get today stats:", error);
        throw new Error("Failed to get today stats");
      }
    }),

  /**
   * Get activity logs
   */
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const logs = await db.getActivityLogsByAccountId(input.accountId, input.limit);

        return {
          success: true,
          logs: logs.map((log: any) => ({
            id: log.id,
            action: log.action,
            status: log.status,
            details: log.details,
            error: null as string | null,
            createdAt: log.timestamp,
          })),
        };
      } catch (error) {
        console.error("Failed to get activity logs:", error);
        throw new Error("Failed to get activity logs");
      }
    }),

  /**
   * Get account overview
   */
  getAccountOverview: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const today = new Date().toISOString().split("T")[0];
        const stats = await db.getOrCreateStatistics(input.accountId, today);

        return {
          success: true,
          overview: {
            phoneNumber: account.phoneNumber,
            firstName: account.firstName,
            lastName: account.lastName,
            username: account.username,
            isActive: account.isActive,
            isRestricted: account.isRestricted,
            warmingLevel: account.warmingLevel,
            messagesSentToday: account.messagesSentToday,
            dailyLimit: account.dailyLimit,
            lastActivityAt: account.lastActivityAt,
            lastRestrictedAt: account.lastRestrictedAt,
            todayStats: {
              messagesSent: stats.messagesSent || 0,
              messagesFailed: stats.errors || 0,
              membersExtracted: 0,
              groupsJoined: 0,
              groupsLeft: 0,
              usersAdded: stats.membersAdded || 0,
              successRate: ((stats.messagesSent || 0) / ((stats.messagesSent || 0) + (stats.errors || 0) || 1)) * 100,
            },
          },
        };
      } catch (error) {
        console.error("Failed to get account overview:", error);
        throw new Error("Failed to get account overview");
      }
    }),

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const today = new Date().toISOString().split("T")[0];
        const stats = await db.getOrCreateStatistics(input.accountId, today);

        const totalOperations = (stats.messagesSent || 0) + (stats.errors || 0);
        const successRate =
          totalOperations > 0 ? ((stats.messagesSent || 0) / totalOperations) * 100 : 0;

        return {
          success: true,
          metrics: {
            successRate: Math.round(successRate),
            totalOperations,
            successfulOperations: stats.messagesSent || 0,
            failedOperations: stats.errors || 0,
            warmingLevel: account.warmingLevel,
            accountHealth: account.isRestricted ? "restricted" : "healthy",
            utilizationRate: Math.round(
              (account.messagesSentToday / account.dailyLimit) * 100
            ),
          },
        };
      } catch (error) {
        console.error("Failed to get performance metrics:", error);
        throw new Error("Failed to get performance metrics");
      }
    }),
  /**
   * Get global statistics for the user
   */
  getGlobalStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not connected");

      // Get basic counts
      const totalOperations = await db.getOperationsCountToday() || 0;
      const activeAccounts = await db.getActiveAccountsCount() || 0;

      // Calculate real success rate from logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const logSummary = await dbInstance
        .select({
          status: db.activityLogs.status,
          count: db.sql<number>`count(*)`
        })
        .from(db.activityLogs)
        .where(db.gte(db.activityLogs.timestamp, today))
        .groupBy(db.activityLogs.status);

      let successCount = 0;
      let totalCount = 0;

      for (const item of logSummary) {
        if (item.status === 'success') successCount = Number(item.count);
        totalCount += Number(item.count);
      }

      const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 100;

      // Get blocked attacks from anti-ban rules (assuming they track triggers)
      // For now, count 'warning' status logs as blocked/intervened attacks
      const blockedAttacks = logSummary.find(item => item.status === 'warning')?.count || 0;

      return {
        successRate: Math.round(successRate * 10) / 10,
        totalOperations,
        activeAccounts,
        blockedAttacks: Number(blockedAttacks),
      };
    } catch (error) {
      console.error("[StatsRouter] Global stats error:", error);
      return {
        successRate: 100,
        totalOperations: 0,
        activeAccounts: 0,
        blockedAttacks: 0,
      };
    }
  }),

  /**
   * Get global activity logs for the user
   */
  getGlobalActivityLogs: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      try {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not connected");

        const logs = await dbInstance
          .select()
          .from(db.activityLogs)
          .where(db.eq(db.activityLogs.userId, ctx.user.id))
          .orderBy(db.desc(db.activityLogs.timestamp))
          .limit(input.limit);

        return {
          success: true,
          logs: logs.map((log: any) => ({
            id: log.id,
            action: log.action,
            status: log.status,
            details: log.details,
            timestamp: log.timestamp.toISOString(),
          })),
        };
      } catch (error) {
        console.error("[StatsRouter] Global logs error:", error);
        return { success: false, logs: [] };
      }
    }),
});
