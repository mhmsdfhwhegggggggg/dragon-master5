import { pgTable, text, integer, timestamp, boolean, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users Table
 * Stores application users
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Telegram Accounts Table
 * Stores connected Telegram accounts for each user
 */
export const telegramAccounts = pgTable("telegram_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  phoneNumber: text("phone_number").unique().notNull(),
  telegramId: text("telegram_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username"),
  sessionString: text("session_string").notNull(), // Encrypted session string
  isActive: boolean("is_active").default(true).notNull(),
  isRestricted: boolean("is_restricted").default(false).notNull(),
  restrictionReason: text("restriction_reason"),
  warmingLevel: integer("warming_level").default(0).notNull(), // 0-100%
  messagesSentToday: integer("messages_sent_today").default(0).notNull(),
  dailyLimit: integer("daily_limit").default(100).notNull(),
  lastActivityAt: timestamp("last_activity_at"),
  lastRestrictedAt: timestamp("last_restricted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  apiId: integer("api_id"),
  apiHash: text("api_hash"),
});

export type TelegramAccount = typeof telegramAccounts.$inferSelect;
export type InsertTelegramAccount = typeof telegramAccounts.$inferInsert;

/**
 * Extracted Members Table
 * Stores members extracted from Telegram groups
 */
export const extractedMembers = pgTable("extracted_members", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => telegramAccounts.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(), // Telegram user ID
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  isBot: boolean("is_bot").default(false),
  isPremium: boolean("is_premium").default(false),
  sourceGroupId: text("source_group_id").notNull(),
  sourceGroupTitle: text("source_group_title"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
  lastSeenOnline: timestamp("last_seen_online"),
  isActive: boolean("is_active").default(true),
  metadata: text("metadata"), // JSON string for additional data
});

export type ExtractedMember = typeof extractedMembers.$inferSelect;
export type InsertExtractedMember = typeof extractedMembers.$inferInsert;

/**
 * Bulk Operations Table
 * Tracks bulk operations like sending messages, adding users, etc.
 */
export const bulkOperations = pgTable("bulk_operations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'send_message', 'add_user', 'join_group', etc.
  status: text("status").default("pending").notNull(), // 'pending', 'running', 'paused', 'completed', 'failed'
  totalTargets: integer("total_targets").default(0).notNull(),
  processedTargets: integer("processed_targets").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  config: text("config").notNull(), // JSON string with operation configuration
  messageTemplate: text("message_template"),
  delayMs: integer("delay_ms").default(2000).notNull(),
  autoRepeat: boolean("auto_repeat").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export type BulkOperation = typeof bulkOperations.$inferSelect;
export type InsertBulkOperation = typeof bulkOperations.$inferInsert;

/**
 * Operation Results Table
 * Stores individual results for each target in a bulk operation
 */
export const operationResults = pgTable("operation_results", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => bulkOperations.id, { onDelete: "cascade" }).notNull(),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(), // 'user', 'group', 'channel'
  status: text("status").notNull(), // 'success', 'failed', 'skipped'
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  metadata: text("metadata"), // JSON string for additional data
});

export type OperationResult = typeof operationResults.$inferSelect;
export type InsertOperationResult = typeof operationResults.$inferInsert;

/**
 * Proxy Configs Table
 * Stores proxy configurations for accounts
 */
export const proxyConfigs = pgTable("proxy_configs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => telegramAccounts.id, { onDelete: "set null" }),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  type: text("type").default("socks5").notNull(), // 'socks5', 'http', 'https'
  username: text("username"),
  password: text("password"),
  isActive: boolean("is_active").default(true).notNull(),
  lastCheckedAt: timestamp("last_checked_at"),
  isWorking: boolean("is_working").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProxyConfig = typeof proxyConfigs.$inferSelect;
export type InsertProxyConfig = typeof proxyConfigs.$inferInsert;

/**
 * Statistics Table
 * Stores aggregated statistics for analytics
 */
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  messagesSent: integer("messages_sent").default(0).notNull(),
  messagesFailed: integer("messages_failed").default(0).notNull(),
  membersExtracted: integer("members_extracted").default(0).notNull(),
  usersAdded: integer("users_added").default(0).notNull(),
  groupsJoined: integer("groups_joined").default(0).notNull(),
  activeAccounts: integer("active_accounts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = typeof statistics.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  telegramAccounts: many(telegramAccounts),
  bulkOperations: many(bulkOperations),
  statistics: many(statistics),
}));

export const telegramAccountsRelations = relations(telegramAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [telegramAccounts.userId],
    references: [users.id],
  }),
  extractedMembers: many(extractedMembers),
  bulkOperations: many(bulkOperations),
  proxyConfig: one(proxyConfigs),
}));

export const bulkOperationsRelations = relations(bulkOperations, ({ one, many }) => ({
  user: one(users, {
    fields: [bulkOperations.userId],
    references: [users.id],
  }),
  operationResults: many(operationResults),
}));

export const extractedMembersRelations = relations(extractedMembers, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [extractedMembers.accountId],
    references: [telegramAccounts.id],
  }),
}));

export const operationResultsRelations = relations(operationResults, ({ one }) => ({
  operation: one(bulkOperations, {
    fields: [operationResults.operationId],
    references: [bulkOperations.id],
  }),
}));

export const statisticsRelations = relations(statistics, ({ one }) => ({
  user: one(users, {
    fields: [statistics.userId],
    references: [users.id],
  }),
}));

export const proxyConfigsRelations = relations(proxyConfigs, ({ one }) => ({
  account: one(telegramAccounts, {
    fields: [proxyConfigs.accountId],
    references: [telegramAccounts.id],
  }),
}));

// Indexes for performance
export const usersEmailIndex = index("users_email_index").on(users.email);
export const usersUsernameIndex = index("users_username_index").on(users.username);
export const telegramAccountsUserIdIndex = index("telegram_accounts_user_id_index").on(telegramAccounts.userId);
export const telegramAccountsPhoneNumberIndex = index("telegram_accounts_phone_number_index").on(telegramAccounts.phoneNumber);
export const extractedMembersAccountIdIndex = index("extracted_members_account_id_index").on(extractedMembers.accountId);
export const extractedMembersSourceGroupIdIndex = index("extracted_members_source_group_id_index").on(extractedMembers.sourceGroupId);
export const bulkOperationsUserIdIndex = index("bulk_operations_user_id_index").on(bulkOperations.userId);
export const operationResultsOperationIdIndex = index("operation_results_operation_id_index").on(operationResults.operationId);
export const statisticsUserIdDateIndex = index("statistics_user_id_date_index").on(statistics.userId, statistics.date);
