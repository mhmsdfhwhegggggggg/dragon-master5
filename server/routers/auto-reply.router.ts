/**
 * Auto Reply Router 🔥
 * 
 * API endpoints for intelligent auto-reply system:
 * - Keyword matching (exact, regex)
 * - 3 reply types (fixed, templates, AI)
 * - Human-like delays
 * - Emoji reactions
 * - Daily limits and smart filtering
 * 
 * @version 6.0.0
 * @author Dragon Team
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { autoReplyService } from "../services/auto-reply.service";

/**
 * Auto Reply Router
 */
export const autoReplyRouter = router({
  /**
   * Create new reply rule
   */
  createRule: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      name: z.string().min(1).max(100),
      keywords: z.array(z.string()).min(1).max(50),
      matchType: z.enum(['exact', 'contains', 'regex']),
      replyType: z.enum(['fixed', 'template', 'ai']),
      replyContent: z.union([
        z.string(),
        z.array(z.string())
      ]),
      aiPrompt: z.string().optional(),
      delay: z.object({
        min: z.number().min(500).default(2000),
        max: z.number().min(1000).default(5000)
      }),
      reactions: z.array(z.string()).max(10).optional(),
      options: z.object({
        targetTypes: z.array(z.enum(['private', 'group', 'supergroup', 'channel'])).min(1),
        targetUsers: z.array(z.string()).optional(),
        excludeUsers: z.array(z.string()).optional(),
        targetGroups: z.array(z.string()).optional(),
        excludeGroups: z.array(z.string()).optional(),
        markAsRead: z.boolean().default(false),
        deleteOriginal: z.boolean().default(false),
        dailyLimit: z.number().min(1).max(1000).default(50),
        priority: z.number().min(1).max(10).default(5)
      }),
      isActive: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const rule = await autoReplyService.createRule({
          name: input.name,
          accountId: input.accountId,
          userId: ctx.user.id,
          keywords: input.keywords,
          matchType: input.matchType as any,
          replyType: input.replyType as any,
          replyContent: input.replyContent,
          aiPrompt: input.aiPrompt,
          delay: input.delay as any,
          reactions: input.reactions || [],
          options: input.options as any,
          priority: 1, // Default priority
          isActive: input.isActive
        });

        return {
          success: true,
          data: rule,
          message: 'Reply rule created successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to create reply rule'
        };
      }
    }),

  getRules: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      isActive: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ input, ctx }) => {
      try {
        const rules = await autoReplyService.getRules(input.accountId, {
          isActive: input.isActive
        });

        return {
          success: true,
          data: {
            rules: rules.slice(input.offset, input.offset + input.limit),
            total: rules.length,
            hasMore: input.offset + input.limit < rules.length
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
   */
  updateRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number(),
      updates: z.object({
        name: z.string().min(1).max(100).optional(),
        keywords: z.array(z.string()).min(1).max(50).optional(),
        matchType: z.enum(['exact', 'contains', 'regex']).optional(),
        replyContent: z.union([
          z.string(),
          z.array(z.string())
        ]).optional(),
        delay: z.object({
          min: z.number().min(500).optional(),
          max: z.number().min(1000).optional()
        }).optional(),
        reactions: z.array(z.string()).max(10).optional(),
        options: z.object({
          targetTypes: z.array(z.enum(['private', 'group', 'supergroup', 'channel'])).optional(),
          dailyLimit: z.number().min(1).max(1000).optional(),
          priority: z.number().min(1).max(10).optional()
        }).optional(),
        isActive: z.boolean().optional()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await autoReplyService.updateRule(input.ruleId, input.updates as any);
        return {
          success: true,
          message: 'Reply rule updated successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to update reply rule'
        };
      }
    }),

  /**
   * Delete reply rule
   */
  deleteRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await autoReplyService.deleteRule(input.ruleId, input.accountId);
        return {
          success: true,
          message: 'Reply rule deleted successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to delete reply rule'
        };
      }
    }),

  /**
   * Get reply statistics
   */
  getReplyStats: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      period: z.enum(['today', 'week', 'month', 'all']).default('today')
    }))
    .query(async ({ input, ctx }) => {
      try {
        const stats = await autoReplyService.getReplyStats(input.accountId);
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
   * Test reply rule
   */
  testRule: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      ruleId: z.string(),
      testMessage: z.string(),
      testContext: z.object({
        fromId: z.string(),
        chatId: z.string(),
        chatType: z.enum(['private', 'group', 'supergroup', 'channel']),
        timestamp: z.date().optional().default(() => new Date())
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const rules = await autoReplyService.getRules(input.accountId, { isActive: true });
        const rule = rules.find(r => r.id === input.ruleId);

        if (!rule) {
          throw new Error('Rule not found or inactive');
        }

        // We use a simplified version of findMatchingRule logic for the test
        const text = input.testMessage.toLowerCase();
        const matchedKeywords = rule.keywords.filter(keyword => {
          const kw = keyword.toLowerCase();
          if (rule.matchType === 'exact') return text === kw;
          if (rule.matchType === 'contains') return text.includes(kw);
          if (rule.matchType === 'regex') {
            try { return new RegExp(kw, 'i').test(text); } catch (e) { return false; }
          }
          return false;
        });

        const matched = matchedKeywords.length > 0 && rule.options.targetTypes.includes(input.testContext.chatType as any);

        let replyContent = '';
        if (matched) {
          if (rule.replyType === 'fixed') {
            replyContent = rule.replyContent as string;
          } else if (rule.replyType === 'template') {
            const templates = rule.replyContent as string[];
            replyContent = templates[0]; // Just return first template for test
          } else if (rule.replyType === 'ai') {
            replyContent = "Generating AI response..."; // Placeholder for instant UI feedback
          }
        }

        return {
          success: true,
          data: {
            matched,
            matchedKeywords,
            replyContent,
            delay: rule.delay.min,
            reactions: rule.reactions,
            confidence: matched ? 1.0 : 0
          },
          message: 'Rule test completed successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to test reply rule'
        };
      }
    }),

  /**
   * Toggle rule active status
   */
  toggleRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      accountId: z.number(),
      isActive: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await autoReplyService.updateRule(input.ruleId, { isActive: input.isActive } as any);
        return {
          success: true,
          message: `Rule ${input.isActive ? 'activated' : 'deactivated'} successfully`
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to toggle rule status'
        };
      }
    }),

  /**
   * Get reply templates
   */
  getReplyTemplates: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      category: z.enum(['greeting', 'support', 'marketing', 'faq']).optional()
    }))
    .query(async ({ input, ctx }) => {
      try {
        const templates: Record<string, any[]> = {
          greeting: [
            {
              id: 't-1',
              name: 'ترحيب عربي',
              content: 'أهلاً بك! كيف يمكنني مساعدتك اليوم؟',
              variables: ['{name}']
            },
            {
              id: 't-2',
              name: 'English Greeting',
              content: 'Hello! How can I help you today?',
              variables: ['{name}']
            }
          ],
          support: [
            {
              id: 't-3',
              name: 'سؤال عن السعر',
              content: 'السعر الحالي هو {price} ريال. هل ترغب في الطلب؟',
              variables: ['{price}']
            }
          ],
          marketing: [
            {
              id: 't-4',
              name: 'عرض خاص',
              content: 'لدينا عرض خاص لك! خصم 20% على أول طلب.',
              variables: []
            }
          ],
          faq: [
            {
              id: 't-5',
              name: 'مواعيد العمل',
              content: 'نحن نعمل من الساعة 9 صباحاً حتى 9 مساءً.',
              variables: []
            }
          ]
        };

        const result = input.category ? (templates[input.category] || []) : Object.values(templates).flat();

        return {
          success: true,
          data: {
            templates: result,
            categories: Object.keys(templates)
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
   * Get AI reply suggestions
   */
  getAISuggestions: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      keywords: z.array(z.string()).max(10),
      context: z.string().max(500)
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { aiChatEngine } = await import('../services/ai-chat-engine');

        const suggestion = await aiChatEngine.generateResponse({
          history: [{ role: 'user', content: input.context }],
          targetUser: { name: 'User' },
          personality: 'friendly'
        });

        return {
          success: true,
          data: {
            suggestions: [
              {
                keyword: input.keywords[0] || 'general',
                suggestedReply: suggestion,
                confidence: 0.95,
                category: 'ai_generated'
              }
            ],
            totalGenerated: 1
          },
          message: 'AI suggestion generated successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to generate AI suggestions'
        };
      }
    }),

  /**
   * Export/import reply rules
   */
  exportRules: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      format: z.enum(['json', 'csv']).default('json')
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const exportData = await autoReplyService.exportRules(input.accountId);
        return {
          success: true,
          data: exportData,
          message: 'Rules exported successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to export rules'
        };
      }
    }),

  /**
   * Import reply rules
   */
  importRules: protectedProcedure
    .input(z.object({
      accountId: z.number(),
      rules: z.array(z.any()),
      overwrite: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await autoReplyService.importRules(input.accountId, ctx.user.id, input.rules);
        return {
          success: true,
          data: {
            imported: result.imported,
            skipped: result.skipped,
            total: input.rules.length
          },
          message: 'Rules imported successfully'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to import rules'
        };
      }
    })
});
