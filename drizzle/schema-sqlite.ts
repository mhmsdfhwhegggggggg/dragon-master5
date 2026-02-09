import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Users Table
 * Stores application users
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Telegram Accounts Table
 * Stores connected Telegram accounts for each user
 */
export const telegramAccounts = sqliteTable("telegram_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull().unique(),
  telegramId: text("telegram_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username"),
  sessionString: text("session_string").notNull(), // Encrypted session string
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  isRestricted: integer("is_restricted", { mode: "boolean" }).default(false).notNull(),
  restrictionReason: text("restriction_reason"),
  warmingLevel: integer("warming_level").default(0).notNull(), // 0-100%
  messagesSentToday: integer("messages_sent_today").default(0).notNull(),
  dailyLimit: integer("daily_limit").default(100).notNull(),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
  lastRestrictedAt: integer("last_restricted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  apiId: integer("api_id"),
  apiHash: text("api_hash"),
});

export type TelegramAccount = typeof telegramAccounts.$inferSelect;
export type InsertTelegramAccount = typeof telegramAccounts.$inferInsert;

/**
 * Extracted Members Table
 * Stores members extracted from Telegram groups
 */
export const extractedMembers = sqliteTable("extracted_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => telegramAccounts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Telegram user ID
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  isBot: integer("is_bot", { mode: "boolean" }).default(false),
  isPremium: integer("is_premium", { mode: "boolean" }).default(false),
  sourceGroupId: text("source_group_id").notNull(),
  sourceGroupTitle: text("source_group_title"),
  extractedAt: integer("extracted_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastSeenOnline: integer("last_seen_online", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  metadata: text("metadata"), // JSON string for additional data
});

export type ExtractedMember = typeof extractedMembers.$inferSelect;
export type InsertExtractedMember = typeof extractedMembers.$inferInsert;

/**
 * Bulk Operations Table
 * Tracks bulk operations like sending messages, adding users, etc.
 */
export const bulkOperations = sqliteTable("bulk_operations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'send_message', 'add_user', 'join_group', etc.
  status: text("status").default("pending").notNull(), // 'pending', 'running', 'paused', 'completed', 'failed'
  totalTargets: integer("total_targets").default(0).notNull(),
  processedTargets: integer("processed_targets").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  config: text("config").notNull(), // JSON string with operation configuration
  messageTemplate: text("message_template"),
  delayMs: integer("delay_ms").default(2000).notNull(),
  autoRepeat: integer("auto_repeat", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
});

export type BulkOperation = typeof bulkOperations.$inferSelect;
export type InsertBulkOperation = typeof bulkOperations.$inferInsert;

/**
 * Operation Results Table
 * Stores individual results for each target in a bulk operation
 */
export const operationResults = sqliteTable("operation_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  operationId: integer("operation_id").notNull().references(() => bulkOperations.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(), // 'user', 'group', 'channel'
  status: text("status").notNull(), // 'success', 'failed', 'skipped'
  errorMessage: text("error_message"),
  processedAt: integer("processed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  metadata: text("metadata"), // JSON string for additional data
});

export type OperationResult = typeof operationResults.$inferSelect;
export type InsertOperationResult = typeof operationResults.$inferInsert;

/**
 * Proxy Configs Table
 * Stores proxy configurations for accounts
 */
export const proxyConfigs = sqliteTable("proxy_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").references(() => telegramAccounts.id, { onDelete: "set null" }),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  type: text("type").default("socks5").notNull(), // 'socks5', 'http', 'https'
  username: text("username"),
  password: text("password"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
  isWorking: integer("is_working", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type ProxyConfig = typeof proxyConfigs.$inferSelect;
export type InsertProxyConfig = typeof proxyConfigs.$inferInsert;

/**
 * Statistics Table
 * Stores aggregated statistics for analytics
 */
export const statistics = sqliteTable("statistics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  messagesSent: integer("messages_sent").default(0).notNull(),
  messagesFailed: integer("messages_failed").default(0).notNull(),
  membersExtracted: integer("members_extracted").default(0).notNull(),
  groupsJoined: integer("groups_joined").default(0).notNull(),
  usersAdded: integer("users_added").default(0).notNull(),
  accountsRestricted: integer("accounts_restricted").default(0).notNull(),
  operationsCompleted: integer("operations_completed").default(0).notNull(),
  operationsFailed: integer("operations_failed").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Statistic = typeof statistics.$inferSelect;
export type InsertStatistic = typeof statistics.$inferInsert;

/**
 * Anti-Ban Rules Table
 * Stores anti-ban rules and configurations
 */
export const antiBanRules = sqliteTable("anti_ban_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => telegramAccounts.id, { onDelete: "cascade" }),
  ruleType: text("rule_type").notNull(), // 'rate_limit', 'delay', 'warming', etc.
  config: text("config").notNull(), // JSON string with rule configuration
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  priority: integer("priority").default(0).notNull(),
  triggeredCount: integer("triggered_count").default(0).notNull(),
  lastTriggeredAt: integer("last_triggered_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type AntiBanRule = typeof antiBanRules.$inferSelect;
export type InsertAntiBanRule = typeof antiBanRules.$inferInsert;

/**
 * Activity Logs Table
 * Stores activity logs for auditing
 */
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  accountId: integer("account_id").references(() => telegramAccounts.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  details: text("details"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Rate Limit Tracking Table
 * Tracks rate limits for anti-ban protection
 */
export const rateLimitTracking = sqliteTable("rate_limit_tracking", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => telegramAccounts.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(), // 'message', 'join', 'add_user', etc.
  count: integer("count").default(0).notNull(),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
  windowEnd: integer("window_end", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type RateLimitTracking = typeof rateLimitTracking.$inferSelect;
export type InsertRateLimitTracking = typeof rateLimitTracking.$inferInsert;

/**
 * Session History Table
 * Tracks session changes for accounts
 */
export const sessionHistory = sqliteTable("session_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => telegramAccounts.id, { onDelete: "cascade" }),
  sessionString: text("session_string").notNull(),
  isValid: integer("is_valid", { mode: "boolean" }).default(true).notNull(),
  invalidatedAt: integer("invalidated_at", { mode: "timestamp" }),
  invalidationReason: text("invalidation_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type SessionHistory = typeof sessionHistory.$inferSelect;
export type InsertSessionHistory = typeof sessionHistory.$inferInsert;

/**
 * App Permissions Table
 * Stores app permissions for developer control
 */
export const appPermissions = sqliteTable("app_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().unique(),
  deviceName: text("device_name"),
  userId: integer("user_id"),
  permissionKey: text("permission_key").notNull().unique(),
  status: text("status").notNull().default("active"), // active, suspended, expired, revoked
  permissionType: text("permission_type").notNull().default("trial"), // trial, basic, premium, unlimited
  maxAccounts: integer("max_accounts").default(1),
  maxMessagesPerDay: integer("max_messages_per_day").default(100),
  maxOperationsPerDay: integer("max_operations_per_day").default(10),
  features: text("features"), // JSON array
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  activatedAt: integer("activated_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  suspendedAt: integer("suspended_at", { mode: "timestamp" }),
  suspendReason: text("suspend_reason"),
  usageCount: integer("usage_count").default(0),
  notes: text("notes"),
  ipAddress: text("ip_address"),
  country: text("country"),
});

export type AppPermission = typeof appPermissions.$inferSelect;
export type InsertAppPermission = typeof appPermissions.$inferInsert;

/**
 * Permission Usage Logs Table
 */
export const permissionUsageLogs = sqliteTable("permission_usage_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  permissionId: integer("permission_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type PermissionUsageLog = typeof permissionUsageLogs.$inferSelect;
export type InsertPermissionUsageLog = typeof permissionUsageLogs.$inferInsert;

/**
 * Group Metadata Table
 * Stores metadata about Telegram groups
 */
export const groupMetadata = sqliteTable("group_metadata", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: text("group_id").notNull().unique(),
  title: text("title").notNull(),
  username: text("username"),
  memberCount: integer("member_count"),
  description: text("description"),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  lastScrapedAt: integer("last_scraped_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type GroupMetadata = typeof groupMetadata.$inferSelect;
export type InsertGroupMetadata = typeof groupMetadata.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  telegramAccounts: many(telegramAccounts),
  bulkOperations: many(bulkOperations),
  statistics: many(statistics),
  activityLogs: many(activityLogs),
}));

export const telegramAccountsRelations = relations(telegramAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [telegramAccounts.userId],
    references: [users.id],
  }),
  extractedMembers: many(extractedMembers),
  proxyConfig: many(proxyConfigs),
  antiBanRules: many(antiBanRules),
  activityLogs: many(activityLogs),
  rateLimitTracking: many(rateLimitTracking),
  sessionHistory: many(sessionHistory),
}));

export const bulkOperationsRelations = relations(bulkOperations, ({ one, many }) => ({
  user: one(users, {
    fields: [bulkOperations.userId],
    references: [users.id],
  }),
  results: many(operationResults),
}));

export const operationResultsRelations = relations(operationResults, ({ one }) => ({
  operation: one(bulkOperations, {
    fields: [operationResults.operationId],
    references: [bulkOperations.id],
  }),
}));
