// Database connection and utilities
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
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
} from "../drizzle/schema-sqlite";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: Database.Database | null = null;

/**
 * Get or create database connection
 */
export async function getDb() {
  const url = Secrets.getDatabaseUrl();
  if (!_db && url) {
    try {
      // Extract file path from URL (remove 'file:' prefix if present)
      const dbPath = url.replace(/^file:/, "");
      _client = new Database(dbPath);
      _db = drizzle(_client);
      console.log("[Database] Connected successfully to SQLite:", dbPath);
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
    _client.close();
    _db = null;
    _client = null;
    console.log("[Database] Connection closed");
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
  return db.select().from(extractedMembers).where(eq(extractedMembers.accountId, accountId));
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

export async function getActivityLogsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).limit(limit);
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
  return db.select().from(statistics).where(
    and(eq(statistics.userId, userId), eq(statistics.date, date))
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

// Import eq, and, and other operators
import { eq, and, or } from "drizzle-orm";

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
    and(eq(extractedMembers.accountId, accountId), eq(extractedMembers.sourceGroupId, groupId))
  );
}

export async function getOrCreateAntiBanRules(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const existing = await db.select().from(antiBanRules).where(eq(antiBanRules.accountId, accountId));
  if (existing.length > 0) {
    return existing;
  }
  // Create default rules
  const defaultRules = [
    {
      accountId,
      ruleType: "rate_limit",
      config: JSON.stringify({ maxPerHour: 30, maxPerDay: 100 }),
      isActive: true,
      priority: 1,
    },
    {
      accountId,
      ruleType: "delay",
      config: JSON.stringify({ minDelay: 2000, maxDelay: 5000 }),
      isActive: true,
      priority: 2,
    },
  ];
  return db.insert(antiBanRules).values(defaultRules).returning();
}

export async function updateAntiBanRules(accountId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.update(antiBanRules).set(data).where(eq(antiBanRules.accountId, accountId)).returning();
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
  return db.select().from(activityLogs).where(eq(activityLogs.accountId, accountId)).limit(limit);
}

export async function createProxyConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.insert(proxyConfigs).values(data).returning();
}

// Helper functions for bulk operations (using existing functions above)

// Export all
export * from "../drizzle/schema-sqlite";
