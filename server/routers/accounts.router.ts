import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { JobQueue } from "../_core/queue";
import * as dbHelper from "../db";

export const accountsRouter = router({
  // Get all accounts for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await dbHelper.getTelegramAccountsByUserId(ctx.user.id);

    return accounts.map((account) => ({
      id: account.id,
      phoneNumber: account.phoneNumber,
      username: account.username || "",
      firstName: account.firstName || "",
      lastName: account.lastName || "",
      isActive: account.isActive,
      messagesSentToday: account.messagesSentToday,
      dailyLimit: account.dailyLimit,
      warmingLevel: account.warmingLevel,
      isRestricted: account.isRestricted,
      restrictionReason: account.restrictionReason || "",
      lastActivity: account.lastActivityAt?.toISOString() || new Date().toISOString(),
    }));
  }),

  // Add a new Telegram account
  add: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        sessionString: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
        telegramId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newAccount = await dbHelper.createTelegramAccount({
        userId: ctx.user.id,
        phoneNumber: input.phoneNumber,
        sessionString: input.sessionString,
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        telegramId: input.telegramId,
        isActive: true,
        warmingLevel: 0,
        messagesSentToday: 0,
        dailyLimit: 100,
      } as any);

      return { success: true, account: newAccount };
    }),

  // Delete an account
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await dbHelper.deleteTelegramAccount(input.id);
      return { success: true };
    }),

  // Update account status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await dbHelper.updateTelegramAccount(input.id, { isActive: input.isActive } as any);
      return { success: true };
    }),

  // Enqueue: send login codes to many phone numbers (bulk onboarding)
  bulkSendLoginCodes: protectedProcedure
    .input(z.object({ phoneNumbers: z.array(z.string().min(5)).min(1) }))
    .mutation(async ({ input }) => {
      const job = await JobQueue.enqueue("send-login-codes", { phoneNumbers: input.phoneNumbers } as any);
      return { queued: true, jobId: job.id } as const;
    }),

  // Enqueue: confirm login codes (and optional 2FA) and create accounts
  bulkConfirmCodes: protectedProcedure
    .input(z.object({ items: z.array(z.object({ phoneNumber: z.string().min(5), code: z.string().min(2), password: z.string().optional() })).min(1) }))
    .mutation(async ({ input, ctx }) => {
      const job = await JobQueue.enqueue("confirm-login-codes", { userId: ctx.user.id, items: input.items } as any);
      return { queued: true, jobId: job.id } as const;
    }),
});
