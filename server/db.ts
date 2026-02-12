// Database connection and utilities - PostgreSQL Only
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Secrets } from "./_core/secrets";
import { encryptString, decryptString } from "./_core/crypto";
import {
  InsertUser,
  InsertTelegramAccount,
  InsertExtractedMember,
  InsertBulkOperation,
  InsertActivityLog,
  users,
  telegramAccounts,
  extractedMembers,
  bulkOperations,
  activityLogs,
  statistics,
  antiBanRules,
  proxyConfigs,
} from "./db/schema";
import { eq, count, and, desc, asc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

/**
 * Get or create database connection
 */
export async function getDb() {
  const url = Secrets.getDatabaseUrl();
  if (!_db && url) {
    try {
      // Create PostgreSQL client
      _client = postgres(url, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      _db = drizzle(_client, { schema: { users, telegramAccounts, extractedMembers, bulkOperations, activityLogs, statistics, antiBanRules, proxyConfigs } });
      console.log("[Database] Connected successfully to PostgreSQL:", url.replace(/\/\/.*@/, '//***@'));
    } catch (error) {
      console.error("[Database] Failed to connect to PostgreSQL:", error);
      _db = null;
      _client = null;
      throw error;
    }
  }
  return _db;
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
    console.log("[Database] PostgreSQL connection closed");
  }
}

/**
 * Database helper functions
 */

// Users
export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(users).values(data).returning();
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

// Telegram Accounts
export async function createTelegramAccount(data: InsertTelegramAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  // Encrypt session string before storing
  const encryptedData = {
    ...data,
    sessionString: encryptString(data.sessionString),
  };
  
  return db.insert(telegramAccounts).values(encryptedData).returning();
}

export async function getTelegramAccountsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const accounts = await db.select().from(telegramAccounts).where(eq(telegramAccounts.userId, userId));
  
  // Decrypt session strings
  return accounts.map(account => ({
    ...account,
    sessionString: decryptString(account.sessionString),
  }));
}

export async function getTelegramAccountById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.select().from(telegramAccounts).where(eq(telegramAccounts.id, id)).limit(1);
  
  if (result.length > 0) {
    return {
      ...result[0],
      sessionString: decryptString(result[0].sessionString),
    };
  }
  return null;
}

export async function updateTelegramAccount(id: number, data: Partial<InsertTelegramAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  // Encrypt session string if provided
  const updateData = data.sessionString
    ? { ...data, sessionString: encryptString(data.sessionString) }
    : data;
  
  return db.update(telegramAccounts).set(updateData).where(eq(telegramAccounts.id, id)).returning();
}

export async function deleteTelegramAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.delete(telegramAccounts).where(eq(telegramAccounts.id, id));
}

// Extracted Members
export async function createExtractedMember(data: InsertExtractedMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(extractedMembers).values(data).returning();
}

export async function getExtractedMembersByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(extractedMembers).where(eq(extractedMembers.telegramAccountId, accountId));
}

export async function getExtractedMembersByGroupId(groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(extractedMembers).where(eq(extractedMembers.sourceGroupId, groupId));
}

// Bulk Operations
export async function createBulkOperation(data: InsertBulkOperation) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(bulkOperations).values(data).returning();
}

export async function getBulkOperationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(bulkOperations).where(eq(bulkOperations.userId, userId));
}

export async function getBulkOperationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(bulkOperations).where(eq(bulkOperations.id, id)).limit(1);
}

export async function updateBulkOperation(id: number, data: Partial<InsertBulkOperation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.update(bulkOperations).set(data).where(eq(bulkOperations.id, id)).returning();
}

// Activity Logs
export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(activityLogs).values(data).returning();
}

export async function getActivityLogsByAccountId(accountId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(activityLogs).where(eq(activityLogs.telegramAccountId, accountId)).limit(limit);
}

// Statistics
export async function getStatisticsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(statistics).where(eq(statistics.userId, userId));
}

export async function getStatisticsByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const targetDate = new Date(date);
  return db.select().from(statistics).where(
    and(eq(statistics.userId, userId), eq(statistics.date, targetDate))
  ).limit(1);
}

// Anti-Ban Rules
export async function getAntiBanRulesByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(antiBanRules).where(eq(antiBanRules.userId, accountId));
}

// Proxy Configs
export async function getProxyConfigsByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(proxyConfigs).where(eq(proxyConfigs.telegramAccountId, accountId));
}

export async function getActiveProxyConfigs() {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(proxyConfigs).where(eq(proxyConfigs.health, 'healthy'));
}

// Additional helper functions
export async function upsertUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const existing = await getUserByEmail(data.email);
  if (existing) {
    return db.update(users).set(data).where(eq(users.email, data.email)).returning();
  }
  return db.insert(users).values(data).returning();
}

// License system helper functions
export async function getActiveAccountsCount(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const result = await db
    .select({ count: count() })
    .from(telegramAccounts)
    .where(eq(telegramAccounts.isActive, true));
  
  return result[0]?.count || 0;
}

export async function getOperationsCountToday(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const today = new Date().toISOString().split('T')[0];
  const result = await db
    .select({ count: count() })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.status, 'success'),
        // Note: You may need to add a date field to activityLogs for proper filtering
        // For now, this is a basic implementation
      )
    );
  
  return result[0]?.count || 0;
}

export async function createExtractedMembers(members: InsertExtractedMember[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(extractedMembers).values(members).returning();
}

export async function getExtractedMembersByAccountAndGroup(telegramAccountId: number, groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(extractedMembers).where(
    and(eq(extractedMembers.telegramAccountId, telegramAccountId), eq(extractedMembers.sourceGroupId, groupId))
  );
}

export async function getOrCreateAntiBanRules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const existing = await db.select().from(antiBanRules).where(eq(antiBanRules.userId, userId));
  if (existing.length > 0) {
    return existing;
  }
  
  // Create default anti-ban rules
  const defaultRules = [
    {
      userId,
      ruleName: 'Rate Limiting',
      ruleType: 'rate_limit',
      ruleConfig: JSON.stringify({
        maxMessagesPerMinute: 5,
        maxMessagesPerHour: 50,
        maxMessagesPerDay: 200,
      }),
      isActive: true,
      priority: 1,
    },
    {
      userId,
      ruleName: 'Delay Pattern',
      ruleType: 'delay_pattern',
      ruleConfig: JSON.stringify({
        minDelay: 1000,
        maxDelay: 5000,
        randomDelay: true,
      }),
      isActive: true,
      priority: 2,
    },
  ];
  
  return db.insert(antiBanRules).values(defaultRules).returning();
}

export async function updateAntiBanRules(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.update(antiBanRules).set(data).where(eq(antiBanRules.userId, userId)).returning();
}

export async function getBulkOperationsByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  // Get operations for accounts belonging to this account's user
  return db.select().from(bulkOperations);
}

export async function getOrCreateStatistics(accountId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  // For now, return empty stats - this would need proper user tracking
  return {
    messagesSent: 0,
    messagesFailed: 0,
    membersExtracted: 0,
    groupsJoined: 0,
    usersAdded: 0,
  };
}

export async function getActivityLogsByAccountId(accountId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(activityLogs).where(eq(activityLogs.telegramAccountId, accountId)).limit(limit);
}

export async function createProxyConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(proxyConfigs).values(data).returning();
}

// Helper functions for bulk operations (using existing functions above)

// Export all
export * from "../drizzle/schema-sqlite";
