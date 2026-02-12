import { pgTable, serial, integer, varchar, text, boolean, timestamp, decimal } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Licenses table
export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  licenseKey: varchar('licenseKey', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // trial, basic, premium, enterprise
  status: varchar('status', { length: 50 }).notNull().default('inactive'), // active, inactive, expired, suspended
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  activatedAt: timestamp('activatedAt'),
  expiresAt: timestamp('expiresAt'),
  maxAccounts: integer('maxAccounts').notNull().default(1),
  maxMessages: integer('maxMessages').notNull().default(1000),
  features: text('features').array().notNull().default([]),
  hardwareId: varchar('hardwareId', { length: 255 }),
  lastValidated: timestamp('lastValidated'),
  usageCount: integer('usageCount').notNull().default(0),
  maxUsage: integer('maxUsage'),
  autoRenew: boolean('autoRenew').notNull().default(false),
  renewalPrice: decimal('renewalPrice', { precision: 10, scale: 2 }),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  licenseId: integer('licenseId').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 50 }).notNull(), // monthly, quarterly, yearly, lifetime
  status: varchar('status', { length: 50 }).notNull().default('inactive'), // active, inactive, cancelled, expired
  startDate: timestamp('startDate').notNull(),
  endDate: timestamp('endDate').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  autoRenew: boolean('autoRenew').notNull().default(true),
  nextBillingDate: timestamp('nextBillingDate'),
  paymentMethod: varchar('paymentMethod', { length: 100 }),
  paymentId: varchar('paymentId', { length: 255 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// License usage logs
export const licenseUsageLogs = pgTable('license_usage_logs', {
  id: serial('id').primaryKey(),
  licenseId: integer('licenseId').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  metadata: text('metadata'), // JSON string
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Telegram accounts table (existing)
export const telegramAccounts = pgTable('telegram_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  phoneNumber: varchar('phoneNumber', { length: 20 }).notNull().unique(),
  telegramId: varchar('telegramId', { length: 50 }).unique(),
  firstName: varchar('firstName', { length: 255 }),
  lastName: varchar('lastName', { length: 255 }),
  username: varchar('username', { length: 255 }),
  sessionString: text('sessionString').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  isRestricted: boolean('isRestricted').default(false).notNull(),
  restrictionReason: text('restrictionReason'),
  warmingLevel: integer('warmingLevel').default(0).notNull(),
  messagesSentToday: integer('messagesSentToday').default(0).notNull(),
  dailyLimit: integer('dailyLimit').default(100).notNull(),
  lastActivityAt: timestamp('lastActivityAt'),
  lastRestrictedAt: timestamp('lastRestrictedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Extracted members table (existing)
export const extractedMembers = pgTable('extracted_members', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  telegramAccountId: integer('telegramAccountId').notNull().references(() => telegramAccounts.id, { onDelete: 'cascade' }),
  sourceGroupId: varchar('sourceGroupId', { length: 255 }).notNull(),
  memberTelegramId: varchar('memberTelegramId', { length: 50 }).notNull(),
  memberUsername: varchar('memberUsername', { length: 255 }),
  memberFirstName: varchar('memberFirstName', { length: 255 }),
  memberLastName: varchar('memberLastName', { length: 255 }),
  memberPhone: varchar('memberPhone', { length: 20 }),
  extractionDate: timestamp('extractionDate').defaultNow().notNull(),
  isAdded: boolean('isAdded').default(false).notNull(),
  addedDate: timestamp('addedDate'),
});

// Bulk operations table (existing)
export const bulkOperations = pgTable('bulk_operations', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  operationType: varchar('operationType', { length: 50 }).notNull(), // add_members, send_message, etc.
  sourceGroupId: varchar('sourceGroupId', { length: 255 }),
  targetGroupId: varchar('targetGroupId', { length: 255 }),
  messageContent: text('messageContent'),
  delayBetweenMessages: integer('delayBetweenMessages').default(1000),
  totalMembers: integer('totalMembers').default(0),
  processedMembers: integer('processedMembers').default(0),
  successfulMembers: integer('successfulMembers').default(0),
  failedMembers: integer('failedMembers').default(0),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, running, completed, failed, paused
  startedAt: timestamp('startedAt'),
  completedAt: timestamp('completedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Activity logs table (existing)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  telegramAccountId: integer('telegramAccountId').references(() => telegramAccounts.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  details: text('details'),
  status: varchar('status', { length: 50 }).notNull(), // success, error, warning
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Statistics table (existing)
export const statistics = pgTable('statistics', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  messagesSent: integer('messagesSent').default(0),
  membersAdded: integer('membersAdded').default(0),
  operationsCompleted: integer('operationsCompleted').default(0),
  errors: integer('errors').default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Anti-ban rules table (existing)
export const antiBanRules = pgTable('anti_ban_rules', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ruleName: varchar('ruleName', { length: 255 }).notNull(),
  ruleType: varchar('ruleType', { length: 50 }).notNull(), // rate_limit, delay_pattern, content_filter, etc.
  ruleConfig: text('ruleConfig').notNull(), // JSON string
  isActive: boolean('isActive').default(true).notNull(),
  priority: integer('priority').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Proxy configs table (existing)
export const proxyConfigs = pgTable('proxy_configs', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  telegramAccountId: integer('telegramAccountId').references(() => telegramAccounts.id, { onDelete: 'set null' }),
  host: varchar('host', { length: 255 }).notNull(),
  port: integer('port').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // http, https, socks4, socks5
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 255 }),
  health: varchar('health', { length: 20 }).default('unknown').notNull(), // healthy, unhealthy, unknown
  lastCheckedAt: timestamp('lastCheckedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Export all tables
export const schema = {
  users,
  licenses,
  subscriptions,
  licenseUsageLogs,
  telegramAccounts,
  extractedMembers,
  bulkOperations,
  activityLogs,
  statistics,
  antiBanRules,
  proxyConfigs,
};
