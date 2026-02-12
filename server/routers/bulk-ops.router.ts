import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TelegramClientService } from "../services/telegram-client.service";
import { JobQueue } from "../_core/queue";
import { listJobs as listBullJobs, cancelJob as cancelBullJob } from "../_core/queue";

const telegramClientService = new TelegramClientService();

/**
 * Bulk Operations Router
 * Handles mass messaging, group joining, and other bulk operations
 */
export const bulkOpsRouter = router({
  /**
   * Enqueue: Send bulk messages (non-blocking)
   */
  startSendBulkMessages: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        userIds: z.array(z.string()),
        messageTemplate: z.string(),
        delayMs: z.number().default(1000),
        autoRepeat: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const account = await db.getTelegramAccountById(input.accountId);
      if (!account || account.userId !== ctx.user.id) {
        throw new Error("Account not found or unauthorized");
      }
      const job = JobQueue.enqueue("send-bulk-messages", {
        accountId: input.accountId,
        userIds: input.userIds,
        messageTemplate: input.messageTemplate,
        delayMs: input.delayMs,
        autoRepeat: input.autoRepeat,
      });
      return { queued: true, jobId: job.id } as const;
    }),

  /**
   * Enqueue: Extract members from source and add to target (non-blocking)
   */
  startExtractAndAdd: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        source: z.string().min(1),
        target: z.string().min(1),
        extractMode: z.enum(["all", "engaged", "admins"]).default("all"),
        daysActive: z.number().min(1).max(365).optional(),
        excludeBots: z.boolean().default(true),
        requireUsername: z.boolean().default(false),
        limit: z.number().min(1).max(100000).optional(),
        dedupeBy: z.enum(["telegramUserId", "username"]).default("telegramUserId"),
        delayMs: z.number().default(1500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const account = await db.getTelegramAccountById(input.accountId);
      if (!account || account.userId !== ctx.user.id) {
        throw new Error("Account not found or unauthorized");
      }

      const job = JobQueue.enqueue("extract-and-add", {
        accountId: input.accountId,
        source: input.source,
        target: input.target,
        extractMode: input.extractMode,
        daysActive: input.daysActive,
        excludeBots: input.excludeBots,
        requireUsername: input.requireUsername,
        limit: input.limit,
        dedupeBy: input.dedupeBy,
        delayMs: input.delayMs,
      });

      return { queued: true, jobId: job.id } as const;
    }),

  /**
   * Enqueue: Join multiple groups (non-blocking)
   */
  startJoinGroups: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupLinks: z.array(z.string()),
        delayMs: z.number().default(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const account = await db.getTelegramAccountById(input.accountId);
      if (!account || account.userId !== ctx.user.id) {
        throw new Error("Account not found or unauthorized");
      }
      const job = JobQueue.enqueue("join-groups", {
        accountId: input.accountId,
        groupLinks: input.groupLinks,
        delayMs: input.delayMs,
      });
      return { queued: true, jobId: job.id } as const;
    }),

  /**
   * Enqueue: Add users to group (non-blocking)
   */
  startAddUsersToGroup: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupId: z.string(),
        userIds: z.array(z.string()),
        delayMs: z.number().default(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const account = await db.getTelegramAccountById(input.accountId);
      if (!account || account.userId !== ctx.user.id) {
        throw new Error("Account not found or unauthorized");
      }
      const job = JobQueue.enqueue("add-users", {
        accountId: input.accountId,
        groupId: input.groupId,
        userIds: input.userIds,
        delayMs: input.delayMs,
      });
      return { queued: true, jobId: job.id } as const;
    }),

  /**
   * Query: Job status
   */
  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = JobQueue.getJob(input.jobId);
      if (!job) return { found: false } as const;
      return {
        found: true,
        id: job.id,
        status: job.status,
        progress: job.progress,
        result: job.result ?? null,
        error: job.error ?? null,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
      } as const;
    }),

  /**
   * List jobs from BullMQ (waiting/active/delayed/failed/completed)
   */
  listJobs: protectedProcedure
    .input(
      z
        .object({
          states: z.array(z.enum(["waiting", "active", "delayed", "failed", "completed"]))
            .optional(),
          start: z.number().default(0),
          end: z.number().default(50),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const states = input?.states ?? ["waiting", "active", "delayed"] as const;
      const jobs = await listBullJobs(states as any, input?.start ?? 0, input?.end ?? 50);
      return { jobs } as const;
    }),

  /**
   * Cancel a BullMQ job by id
   */
  cancelJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      const res = await cancelBullJob(input.jobId);
      return res;
    }),
  /**
   * Send bulk messages
   */
  sendBulkMessages: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        userIds: z.array(z.string()),
        messageTemplate: z.string(),
        delayMs: z.number().default(1000),
        autoRepeat: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        // Create operation record
        const operation = await db.createBulkOperation({
          accountId: input.accountId,
          operationType: "messages",
          status: "running",
          totalItems: input.userIds.length,
          messageTemplate: input.messageTemplate,
          delayMs: input.delayMs,
          autoRepeat: input.autoRepeat,
          targetData: { userIds: input.userIds },
        });

        // Initialize client
        const credentials = telegramClientService.getApiCredentials();
        const client = await telegramClientService.initializeClient(
          input.accountId,
          account.phoneNumber,
          account.sessionString,
          credentials.apiId,
          credentials.apiHash
        );

        // Send messages
        const result = await telegramClientService.sendBulkMessages(
          input.accountId,
          input.userIds.map((id) => parseInt(id)),
          input.messageTemplate,
          input.delayMs
        );

        // Update operation
        await db.updateBulkOperation(operation.id, {
          status: "completed",
          successCount: result.success,
          failedCount: result.failed,
          completedAt: new Date(),
        });

        // Update account stats
        await db.updateTelegramAccount(input.accountId, {
          messagesSentToday: account.messagesSentToday + result.success,
          lastActivityAt: new Date(),
        });

        // Log activity
        await db.createActivityLog({
          accountId: input.accountId,
          action: "bulk_messages_sent",
          actionDetails: {
            operationId: operation.id,
            success: result.success,
            failed: result.failed,
          },
          status: "success",
        });

        await telegramClientService.disconnectClient(input.accountId);

        return {
          success: true,
          operationId: operation.id,
          messagesSent: result.success,
          messagesFailed: result.failed,
        };
      } catch (error) {
        console.error("Failed to send bulk messages:", error);
        throw new Error(
          `Failed to send bulk messages: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Join multiple groups
   */
  joinGroups: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupLinks: z.array(z.string()),
        delayMs: z.number().default(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const operation = await db.createBulkOperation({
          accountId: input.accountId,
          operationType: "join-groups",
          status: "running",
          totalItems: input.groupLinks.length,
          delayMs: input.delayMs,
          targetData: { groupLinks: input.groupLinks },
        });

        const credentials = telegramClientService.getApiCredentials();
        const client = await telegramClientService.initializeClient(
          input.accountId,
          account.phoneNumber,
          account.sessionString,
          credentials.apiId,
          credentials.apiHash
        );

        let success = 0;
        let failed = 0;

        for (const groupLink of input.groupLinks) {
          try {
            const joined = await telegramClientService.joinGroup(
              input.accountId,
              groupLink
            );
            if (joined) success++;
            else failed++;

            await new Promise((resolve) => setTimeout(resolve, input.delayMs));
          } catch (error) {
            failed++;
          }
        }

        await db.updateBulkOperation(operation.id, {
          status: "completed",
          successCount: success,
          failedCount: failed,
          completedAt: new Date(),
        });

        await db.createActivityLog({
          accountId: input.accountId,
          action: "groups_joined",
          actionDetails: {
            operationId: operation.id,
            success,
            failed,
          },
          status: "success",
        });

        await telegramClientService.disconnectClient(input.accountId);

        return {
          success: true,
          operationId: operation.id,
          groupsJoined: success,
          groupsFailed: failed,
        };
      } catch (error) {
        console.error("Failed to join groups:", error);
        throw new Error(
          `Failed to join groups: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Add users to group
   */
  addUsersToGroup: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupId: z.string(),
        userIds: z.array(z.string()),
        delayMs: z.number().default(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const operation = await db.createBulkOperation({
          accountId: input.accountId,
          operationType: "add-users",
          status: "running",
          totalItems: input.userIds.length,
          delayMs: input.delayMs,
          targetData: { groupId: input.groupId, userIds: input.userIds },
        });

        const credentials = telegramClientService.getApiCredentials();
        const client = await telegramClientService.initializeClient(
          input.accountId,
          account.phoneNumber,
          account.sessionString,
          credentials.apiId,
          credentials.apiHash
        );

        let success = 0;
        let failed = 0;

        for (const userId of input.userIds) {
          try {
            const added = await telegramClientService.addUserToGroup(
              input.accountId,
              input.groupId,
              userId
            );
            if (added) success++;
            else failed++;

            await new Promise((resolve) => setTimeout(resolve, input.delayMs));
          } catch (error) {
            failed++;
          }
        }

        await db.updateBulkOperation(operation.id, {
          status: "completed",
          successCount: success,
          failedCount: failed,
          completedAt: new Date(),
        });

        await db.createActivityLog({
          accountId: input.accountId,
          action: "users_added_to_group",
          actionDetails: {
            operationId: operation.id,
            groupId: input.groupId,
            success,
            failed,
          },
          status: "success",
        });

        await telegramClientService.disconnectClient(input.accountId);

        return {
          success: true,
          operationId: operation.id,
          usersAdded: success,
          usersFailed: failed,
        };
      } catch (error) {
        console.error("Failed to add users to group:", error);
        throw new Error(
          `Failed to add users to group: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get bulk operations history
   */
  getOperations: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const operations = await db.getBulkOperationsByAccountId(input.accountId);

        return {
          success: true,
          operations,
        };
      } catch (error) {
        console.error("Failed to get operations:", error);
        throw new Error("Failed to get operations");
      }
    }),

  /**
   * Cancel operation
   */
  cancelOperation: protectedProcedure
    .input(z.object({ operationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify ownership through operation's account
        // This would require fetching the operation first
        await db.updateBulkOperation(input.operationId, {
          status: "cancelled",
          completedAt: new Date(),
        });

        return {
          success: true,
          message: "Operation cancelled",
        };
      } catch (error) {
        console.error("Failed to cancel operation:", error);
        throw new Error("Failed to cancel operation");
      }
    }),
});
