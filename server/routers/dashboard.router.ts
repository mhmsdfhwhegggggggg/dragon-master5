import { router, protectedProcedure } from "../_core/trpc";
import * as dbHelper from "../db";

export const dashboardRouter = router({
  // Get dashboard statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get total and active accounts
      const accounts = await dbHelper.getTelegramAccountsByUserId(ctx.user.id);

      const totalAccounts = accounts.length;
      const activeAccounts = accounts.filter((a) => a.isActive).length;

      // Get total members extracted
      const accountIds = accounts.map((a) => a.id);
      let membersExtracted = 0;
      
      if (accountIds.length > 0) {
        for (const accountId of accountIds) {
          const members = await dbHelper.getExtractedMembersByAccountAndGroup(accountId, ""); // Empty group means all for this account in this context
          membersExtracted += members.length;
        }
      }

      // Get messages sent today
      const today = new Date().toISOString().split("T")[0];
      const messagesToday = accounts.reduce((sum, acc) => sum + acc.messagesSentToday, 0);

      return {
        totalAccounts,
        activeAccounts,
        membersExtracted,
        messagesToday,
      };
    } catch (error) {
      console.error("Failed to get dashboard stats:", error);
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        membersExtracted: 0,
        messagesToday: 0,
      };
    }
  }),

  // Get recent activities
  getRecentActivities: protectedProcedure.query(async ({ ctx }) => {
    try {
      const accounts = await dbHelper.getTelegramAccountsByUserId(ctx.user.id);
      const accountIds = accounts.map((a) => a.id);
      
      if (accountIds.length === 0) {
        return [];
      }

      let activities: any[] = [];
      for (const accountId of accountIds) {
        const logs = await dbHelper.getActivityLogsByAccountId(accountId, 10);
        activities.push(...logs);
      }
      
      activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      activities = activities.slice(0, 10);

      return activities.map((activity) => ({
        time: activity.createdAt.toISOString(),
        action: activity.action,
        status: activity.status,
        details: activity.actionDetails,
      }));
    } catch (error) {
      console.error("Failed to get recent activities:", error);
      return [];
    }
  }),
});
