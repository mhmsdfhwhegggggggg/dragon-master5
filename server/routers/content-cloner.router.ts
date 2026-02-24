/**
 * Content Cloner Router 🔥🔥🔥
 * 
 * API endpoints for automatic content cloning:
 * - 24/7 competitor monitoring
 * - Automatic content copying
 * - Smart content modification
 * - Multi-target distribution
 * - Advanced filtering & scheduling
 * 
 * @version 6.0.0
 * @author FALCON Team
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { contentClonerService } from "../services/content-cloner.service";

/**
 * Content Cloner Router
 */
export const contentClonerRouter = router({
  /**
   * Create new auto cloner rule
   */
  createClonerRule: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      name: z.string().min(1).max(100),
      sourceChannelIds: z.array(z.string()).min(1).max(10),
      targetChannelIds: z.array(z.string()).min(1).max(20),
      filters: z.object({
        mediaType: z.enum(['all', 'text', 'image', 'video', 'file']).default('all'),
        minViews: z.number().min(0).optional(),
        keywords: z.array(z.string()).optional(),
        excludeKeywords: z.array(z.string()).optional(),
        newerThan: z.date().optional(),
        olderThan: z.date().optional(),
        hasLinks: z.boolean().optional(),
        hasHashtags: z.boolean().optional(),
        hasEmojis: z.boolean().optional()
      }),
      modifications: z.object({
        replaceUsernames: z.array(z.object({
          old: z.string(),
          new: z.string()
        })).default([]),
        replaceLinks: z.array(z.object({
          old: z.string(),
          new: z.string()
        })).default([]),
        replaceText: z.array(z.object({
          old: z.string(),
          new: z.string()
        })).default([]),
        addPrefix: z.string().optional(),
        addSuffix: z.string().optional(),
        removeLinks: z.boolean().default(false),
        removeHashtags: z.boolean().default(false),
        removeEmojis: z.boolean().default(false)
      }),
      schedule: z.object({
        delayBetweenPosts: z.number().min(1000).default(10000),
        randomDelay: z.number().min(0).default(5000),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        maxPostsPerHour: z.number().min(1).optional(),
        onlyDuringHours: z.array(z.number().min(0).max(23)).optional()
      }),
      isActive: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const ruleInput: any = { ...input, userId: ctx.user.id };
        const rule = await contentClonerService.createRule(ruleInput);

        return {
          success: true,
          data: rule,
          message: 'Auto cloner rule created successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to create cloner rule'
        };
      }
    }),

  /**
   * Get cloner rules
   */
  getClonerRules: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      isActive: z.boolean().optional(),
      limit: z.number().min(1).max(50).default(20)
    }))
    .query(async ({ input, ctx }) => {
      try {
        const rules = await contentClonerService.getRules(input.accountId, {
          isActive: input.isActive
        });

        return {
          success: true,
          data: {
            rules: rules.slice(0, input.limit),
            total: rules.length
          }
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    }),

  /**
   * Update cloner rule
   */
  updateClonerRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number(),
      updates: z.object({
        name: z.string().min(1).max(100).optional(),
        sourceChannelIds: z.array(z.string()).min(1).max(10).optional(),
        targetChannelIds: z.array(z.string()).min(1).max(20).optional(),
        filters: z.object({
          mediaType: z.enum(['all', 'text', 'image', 'video', 'file']).optional(),
          minViews: z.number().min(0).optional(),
          keywords: z.array(z.string()).optional(),
          excludeKeywords: z.array(z.string()).optional()
        }).optional(),
        modifications: z.object({
          replaceUsernames: z.array(z.object({
            old: z.string(),
            new: z.string()
          })).optional(),
          replaceLinks: z.array(z.object({
            old: z.string(),
            new: z.string()
          })).optional(),
          addPrefix: z.string().optional(),
          addSuffix: z.string().optional()
        }).optional(),
        schedule: z.object({
          delayBetweenPosts: z.number().min(1000).optional(),
          randomDelay: z.number().min(0).optional(),
          maxPostsPerHour: z.number().min(1).optional()
        }).optional(),
        isActive: z.boolean().optional()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await contentClonerService.updateRule(input.ruleId, input.updates);
        return {
          success: true,
          message: 'Cloner rule updated successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to update cloner rule'
        };
      }
    }),

  /**
   * Delete cloner rule
   */
  deleteClonerRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await contentClonerService.deleteRule(input.ruleId);
        return {
          success: true,
          message: 'Cloner rule deleted successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to delete cloner rule'
        };
      }
    }),

  /**
   * Get cloning statistics
   */
  getCloningStats: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      period: z.enum(['today', 'week', 'month', 'all']).default('today')
    }))
    .query(async ({ input, ctx }) => {
      try {
        const stats = await contentClonerService.getCloningStats(input.accountId);
        return {
          success: true,
          data: stats
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    }),

  /**
   * Get recent cloning activity
   */
  getRecentActivity: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ input, ctx }) => {
      try {
        const history = await contentClonerService.getCloningHistory(input.accountId, input.limit);
        return {
          success: true,
          data: {
            activities: history.history,
            total: history.total
          }
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    }),

  /**
   * Toggle cloner rule
   */
  toggleClonerRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number(),
      isActive: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await contentClonerService.updateRule(input.ruleId, { isActive: input.isActive });
        return {
          success: true,
          message: `Cloner rule ${input.isActive ? 'activated' : 'deactivated'} successfully`
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to toggle cloner rule'
        };
      }
    }),

  /**
   * Test a cloner rule (Simulation)
   */
  testClonerRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number(),
      testMode: z.enum(['single_post', 'monitor_1h']).default('single_post'),
      sourceChannelId: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await contentClonerService.testRule(
          input.ruleId,
          input.accountId,
          input.testMode,
          input.sourceChannelId
        );

        return {
          success: true,
          data: result,
          message: 'Cloner rule test completed'
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    }),

  /**
   * Get cloning queue status
   */
  getCloningQueue: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional()
    }))
    .query(async ({ input, ctx }) => {
      try {
        const queueData = await contentClonerService.getQueue(input.accountId);

        // Mocking the structure expected by the UI but using real rule counts
        const queue = [
          {
            id: 'live-queue-1',
            ruleId: queueData.activeRules[0]?.id || 'none',
            ruleName: queueData.activeRules[0]?.name || 'No active rules',
            status: queueData.status,
            priority: 5,
            postsFound: 0,
            postsProcessed: 0,
            postsRemaining: queueData.pendingTasks,
            estimatedCompletion: null,
            startedAt: new Date()
          }
        ];

        return {
          success: true,
          data: {
            queue,
            total: queue.length,
            summary: {
              pending: queueData.pendingTasks,
              processing: queueData.activeRules.length,
              completed: 0,
              failed: 0
            }
          }
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    }),

  /**
   * Get cloning history
   */
  getCloningHistory: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      ruleId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ input, ctx }) => {
      try {
        const history = await contentClonerService.getCloningHistory(input.accountId, input.limit, input.offset);

        return {
          success: true,
          data: {
            history: history.history,
            total: history.total,
            hasMore: input.offset + input.limit < history.total
          }
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    })
});
