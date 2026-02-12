import { pgTable, text, integer, boolean, timestamp, varchar, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users Table
 * Stores application users
 */
export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).unique().notNull(),
  username: varchar({ length: 255 }).unique().notNull(),
  passwordHash: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  isActive: boolean().default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Telegram Accounts Table
 * Stores connected Telegram accounts for each user
 */
export const telegramAccounts = pgTable("telegram_accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: varchar({ length: 20 }).notNull().unique(),
  telegramId: varchar({ length: 50 }).unique(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  username: varchar({ length: 255 }),
  sessionString: text().notNull(), // Encrypted session string
  isActive: boolean().default(true).notNull(),
  isRestricted: boolean().default(false).notNull(),
  restrictionReason: text(),
  warmingLevel: integer().default(0).notNull(), // 0-100%
  messagesSentToday: integer().default(0).notNull(),
  dailyLimit: integer().default(100).notNull(),
  lastActivityAt: timestamp(),
  lastRestrictedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type TelegramAccount = typeof telegramAccounts.$inferSelect;
export type InsertTelegramAccount = typeof telegramAccounts.$inferInsert;

/**
 * Extracted Members Table
 * Stores extracted member data from groups
 */
export const extractedMembers = pgTable("extracted_members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  groupId: varchar({ length: 50 }).notNull(),
  groupName: varchar({ length: 255 }),
  telegramUserId: varchar({ length: 50 }).notNull(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  username: varchar({ length: 255 }),
  phoneNumber: varchar({ length: 20 }),
  isBot: boolean().default(false).notNull(),
  isActive: boolean().default(true).notNull(),
  lastSeen: timestamp(),
  extractedAt: timestamp().defaultNow().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type ExtractedMember = typeof extractedMembers.$inferSelect;
export type InsertExtractedMember = typeof extractedMembers.$inferInsert;

/**
 * Bulk Operations Table
 * Tracks bulk operation history
 */
export const bulkOperations = pgTable("bulk_operations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  operationType: varchar({ length: 50 }).notNull(), // 'messages', 'add-users', 'join-groups', 'leave-groups', 'boost'
  status: varchar({ length: 50 }).default("pending").notNull(), // 'pending', 'running', 'completed', 'failed'
  totalItems: integer().notNull(),
  successCount: integer().default(0).notNull(),
  failedCount: integer().default(0).notNull(),
  messageTemplate: text(),
  delayMs: integer().default(1000).notNull(),
  autoRepeat: boolean().default(false).notNull(),
  targetData: json(), // Store target group IDs, user IDs, etc.
  startedAt: timestamp(),
  completedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type BulkOperation = typeof bulkOperations.$inferSelect;
export type InsertBulkOperation = typeof bulkOperations.$inferInsert;

/**
 * Operation Results Table
 * Detailed results of each operation item
 */
export const operationResults = pgTable("operation_results", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  operationId: integer()
    .notNull()
    .references(() => bulkOperations.id, { onDelete: "cascade" }),
  targetId: varchar({ length: 50 }).notNull(), // User ID, group ID, etc.
  status: varchar({ length: 50 }).notNull(), // 'success', 'failed', 'pending'
  errorMessage: text(),
  retryCount: integer().default(0).notNull(),
  executedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type OperationResult = typeof operationResults.$inferSelect;
export type InsertOperationResult = typeof operationResults.$inferInsert;

/**
 * Activity Logs Table
 * Tracks all user actions for analytics
 */
export const activityLogs = pgTable("activity_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  action: varchar({ length: 100 }).notNull(), // 'message_sent', 'member_extracted', 'group_joined', etc.
  actionDetails: json(),
  status: varchar({ length: 50 }).notNull(), // 'success', 'failed'
  errorMessage: text(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Rate Limit Tracking Table
 * Tracks rate limits per account
 */
export const rateLimitTracking = pgTable("rate_limit_tracking", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  actionType: varchar({ length: 50 }).notNull(), // 'message', 'join', 'add_user', etc.
  count: integer().default(0).notNull(),
  resetAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type RateLimitTracking = typeof rateLimitTracking.$inferSelect;
export type InsertRateLimitTracking = typeof rateLimitTracking.$inferInsert;

/**
 * Anti-Ban Rules Table
 * Stores anti-ban configuration and rules
 */
export const antiBanRules = pgTable("anti_ban_rules", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  minDelayMs: integer().default(1000).notNull(),
  maxDelayMs: integer().default(3000).notNull(),
  dailyMessageLimit: integer().default(100).notNull(),
  dailyJoinLimit: integer().default(20).notNull(),
  dailyAddUserLimit: integer().default(50).notNull(),
  useProxyRotation: boolean().default(true).notNull(),
  enableRandomization: boolean().default(true).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type AntiBanRule = typeof antiBanRules.$inferSelect;
export type InsertAntiBanRule = typeof antiBanRules.$inferInsert;

/**
 * Proxy Configuration Table
 * Stores proxy settings for accounts
 */
export const proxyConfigs = pgTable("proxy_configs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  proxyUrl: text().notNull(),
  proxyType: varchar({ length: 50 }).notNull(), // 'http', 'socks5', 'socks4'
  username: varchar({ length: 255 }),
  password: text(),
  isActive: boolean().default(true).notNull(),
  lastUsedAt: timestamp(),
  failureCount: integer().default(0).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type ProxyConfig = typeof proxyConfigs.$inferSelect;
export type InsertProxyConfig = typeof proxyConfigs.$inferInsert;

/**
 * Group Metadata Table
 * Caches group information
 */
export const groupMetadata = pgTable("group_metadata", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  groupId: varchar({ length: 50 }).notNull().unique(),
  groupName: varchar({ length: 255 }).notNull(),
  groupUsername: varchar({ length: 255 }),
  memberCount: integer().default(0).notNull(),
  isPublic: boolean().default(true).notNull(),
  description: text(),
  photoUrl: text(),
  lastUpdatedAt: timestamp().defaultNow().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type GroupMetadata = typeof groupMetadata.$inferSelect;
export type InsertGroupMetadata = typeof groupMetadata.$inferInsert;

/**
 * Session History Table
 * Tracks session creation and usage
 */
export const sessionHistory = pgTable("session_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  sessionString: text().notNull(),
  isValid: boolean().default(true).notNull(),
  lastUsedAt: timestamp(),
  expiresAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type SessionHistory = typeof sessionHistory.$inferSelect;
export type InsertSessionHistory = typeof sessionHistory.$inferInsert;

/**
 * Statistics Table
 * Daily statistics for analytics
 */
export const statistics = pgTable("statistics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer()
    .notNull()
    .references(() => telegramAccounts.id, { onDelete: "cascade" }),
  date: varchar({ length: 10 }).notNull(), // YYYY-MM-DD format
  messagesSent: integer().default(0).notNull(),
  messagesFailed: integer().default(0).notNull(),
  membersExtracted: integer().default(0).notNull(),
  groupsJoined: integer().default(0).notNull(),
  groupsLeft: integer().default(0).notNull(),
  usersAdded: integer().default(0).notNull(),
  successRate: decimal({ precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = typeof statistics.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  telegramAccounts: many(telegramAccounts),
}));

export const telegramAccountsRelations = relations(telegramAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [telegramAccounts.userId],
    references: [users.id],
  }),
  extractedMembers: many(extractedMembers),
  bulkOperations: many(bulkOperations),
  activityLogs: many(activityLogs),
  rateLimitTracking: many(rateLimitTracking),
  antiBanRules: many(antiBanRules),
  proxyConfigs: many(proxyConfigs),
  sessionHistory: many(sessionHistory),
  statistics: many(statistics),
}));

export const bulkOperationsRelations = relations(bulkOperations, ({ one, many }) => ({
  account: one(telegramAccounts, {
    fields: [bulkOperations.accountId],
    references: [telegramAccounts.id],
  }),
  results: many(operationResults),
}));

export const operationResultsRelations = relations(operationResults, ({ one }) => ({
  operation: one(bulkOperations, {
    fields: [operationResults.operationId],
    references: [bulkOperations.id],
  }),
}));

export const extractedMembersRelations = relations(extractedMembers, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [extractedMembers.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [activityLogs.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const rateLimitTrackingRelations = relations(rateLimitTracking, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [rateLimitTracking.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const antiBanRulesRelations = relations(antiBanRules, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [antiBanRules.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const proxyConfigsRelations = relations(proxyConfigs, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [proxyConfigs.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const sessionHistoryRelations = relations(sessionHistory, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [sessionHistory.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const statisticsRelations = relations(statistics, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [statistics.accountId],
    references: [telegramAccounts.id],
  }),
}));
