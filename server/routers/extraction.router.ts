import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TelegramClientService } from "../services/telegram-client.service";

const telegramClientService = new TelegramClientService();

/**
 * Extraction Router
 * Handles member extraction from Telegram groups
 */
export const extractionRouter = router({
  /**
   * Extract all members from a group
   */
  extractAllMembers: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupId: z.string(),
        groupName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        // Initialize client
        const credentials = telegramClientService.getApiCredentials();
        const client = await telegramClientService.initializeClient(
          input.accountId,
          account.phoneNumber,
          account.sessionString,
          credentials.apiId,
          credentials.apiHash
        );

        // Extract members
        const members = await telegramClientService.extractGroupMembers(
          input.accountId,
          input.groupId
        );

        // Save to database
        const extractedMembers = members.map((member) => ({
          accountId: input.accountId,
          groupId: input.groupId,
          groupName: input.groupName,
          telegramUserId: String(member.userId),
          firstName: member.firstName,
          lastName: member.lastName,
          username: member.username,
          phoneNumber: member.phoneNumber,
          isBot: member.isBot,
          isActive: member.isActive,
          lastSeen: member.lastSeen,
        }));

        await db.createExtractedMembers(extractedMembers);

        // Log activity
        await db.createActivityLog({
          accountId: input.accountId,
          action: "members_extracted",
          actionDetails: {
            groupId: input.groupId,
            count: members.length,
            type: "all",
          },
          status: "success",
        });

        // Disconnect client
        await telegramClientService.disconnectClient(input.accountId);

        return {
          success: true,
          membersCount: members.length,
          members: extractedMembers,
        };
      } catch (error) {
        console.error("Failed to extract members:", error);
        await db.createActivityLog({
          accountId: input.accountId,
          action: "members_extracted",
          actionDetails: { groupId: input.groupId },
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
        throw new Error(
          `Failed to extract members: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Extract engaged members
   */
  extractEngagedMembers: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupId: z.string(),
        daysActive: z.number().default(7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const credentials = telegramClientService.getApiCredentials();
        const client = await telegramClientService.initializeClient(
          input.accountId,
          account.phoneNumber,
          account.sessionString,
          credentials.apiId,
          credentials.apiHash
        );

        const members = await telegramClientService.extractEngagedMembers(
          input.accountId,
          input.groupId,
          input.daysActive
        );

        const extractedMembers = members.map((member) => ({
          accountId: input.accountId,
          groupId: input.groupId,
          telegramUserId: String(member.userId),
          firstName: member.firstName,
          lastName: member.lastName,
          username: member.username,
          phoneNumber: member.phoneNumber,
          isBot: member.isBot,
          isActive: member.isActive,
          lastSeen: member.lastSeen,
        }));

        await db.createExtractedMembers(extractedMembers);

        await db.createActivityLog({
          accountId: input.accountId,
          action: "engaged_members_extracted",
          actionDetails: {
            groupId: input.groupId,
            count: members.length,
            daysActive: input.daysActive,
          },
          status: "success",
        });

        await telegramClientService.disconnectClient(input.accountId);

        return {
          success: true,
          membersCount: members.length,
          members: extractedMembers,
        };
      } catch (error) {
        console.error("Failed to extract engaged members:", error);
        throw new Error(
          `Failed to extract engaged members: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Extract group administrators
   */
  extractAdmins: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const credentials = telegramClientService.getApiCredentials();
        const client = await telegramClientService.initializeClient(
          input.accountId,
          account.phoneNumber,
          account.sessionString,
          credentials.apiId,
          credentials.apiHash
        );

        const admins = await telegramClientService.extractGroupAdmins(
          input.accountId,
          input.groupId
        );

        const extractedAdmins = admins.map((admin) => ({
          accountId: input.accountId,
          groupId: input.groupId,
          telegramUserId: String(admin.userId),
          firstName: admin.firstName,
          lastName: admin.lastName,
          username: admin.username,
          phoneNumber: admin.phoneNumber,
          isBot: admin.isBot,
          isActive: admin.isActive,
          lastSeen: admin.lastSeen,
        }));

        await db.createExtractedMembers(extractedAdmins);

        await db.createActivityLog({
          accountId: input.accountId,
          action: "admins_extracted",
          actionDetails: {
            groupId: input.groupId,
            count: admins.length,
          },
          status: "success",
        });

        await telegramClientService.disconnectClient(input.accountId);

        return {
          success: true,
          adminsCount: admins.length,
          admins: extractedAdmins,
        };
      } catch (error) {
        console.error("Failed to extract admins:", error);
        throw new Error(
          `Failed to extract admins: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get extracted members
   */
  getExtractedMembers: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        groupId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const account = await db.getTelegramAccountById(input.accountId);

        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        const members = await db.getExtractedMembersByAccountAndGroup(
          input.accountId,
          input.groupId
        );

        return {
          success: true,
          count: members.length,
          members,
        };
      } catch (error) {
        console.error("Failed to get extracted members:", error);
        throw new Error("Failed to get extracted members");
      }
    }),
});
