// Database connection and utilities
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Secrets } from "./_core/secrets";
import { encryptString, decryptString } from "./_core/crypto";
import { and, eq, like, gte, lte, desc, asc, sql } from "drizzle-orm";
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
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

/**
 * Get or create database connection
 */
export async function getDb() {
  const url = Secrets.getDatabaseUrl();
  if (!_db && url) {
    try {
      _client = postgres(url);
      _db = drizzle(_client);
      console.log("[Database] Connected successfully to PostgreSQL:", url.replace(/\/\/.*@/, '//***@'));
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
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
    _db = null;
    _client = null;
    console.log("[Database] Connection closed");
  }
}

// Create a proxy for backward compatibility
export const db = new Proxy({}, {
  get() {
    throw new Error('Database not initialized. Use getDb() to get database instance.');
  }
}) as any;

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

export async function getExtractedMembers(accountId: number, groupId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  if (groupId) {
    return db.select().from(extractedMembers).where(
      and(eq(extractedMembers.accountId, accountId), eq(extractedMembers.groupId, groupId))
    );
  }
  return db.select().from(extractedMembers).where(eq(extractedMembers.accountId, accountId));
}

export async function getExtractedMembersByGroupId(groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(extractedMembers).where(eq(extractedMembers.groupId, groupId));
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
  return db.select().from(bulkOperations).where(eq(bulkOperations.accountId, userId));
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

export async function getActivityLogsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(activityLogs).where(eq(activityLogs.accountId, userId)).limit(limit);
}

// Statistics
export async function getStatisticsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(statistics).where(eq(statistics.accountId, userId));
}

export async function getStatisticsByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(statistics).where(
    and(eq(statistics.accountId, userId), eq(statistics.date, date))
  ).limit(1);
}

// Anti-Ban Rules
export async function getAntiBanRulesByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(antiBanRules).where(eq(antiBanRules.accountId, accountId));
}

// Proxy Configs
export async function getProxyConfigsByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(proxyConfigs).where(eq(proxyConfigs.accountId, accountId));
}

export async function getActiveProxyConfigs() {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(proxyConfigs).where(eq(proxyConfigs.isActive, true));
}

// Export all
export * from "../drizzle/schema";

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

export async function createExtractedMembers(members: InsertExtractedMember[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(extractedMembers).values(members).returning();
}

export async function getExtractedMembersByAccountAndGroup(accountId: number, groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(extractedMembers).where(
    and(eq(extractedMembers.accountId, accountId), eq(extractedMembers.groupId, groupId))
  );
}

export async function getBulkOperationsByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(bulkOperations).where(eq(bulkOperations.accountId, accountId));
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
  return db.select().from(activityLogs).where(eq(activityLogs.accountId, accountId)).limit(limit);
}

export async function createProxyConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(proxyConfigs).values(data).returning();
}
