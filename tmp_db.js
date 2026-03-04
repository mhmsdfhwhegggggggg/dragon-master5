import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Secrets } from "./_core/secrets";
import { encryptString, decryptString } from "./_core/crypto";
import { and, eq, like, gte, lte, desc, asc, sql } from "drizzle-orm";
import {
  users,
  telegramAccounts,
  extractedMembers,
  bulkOperations,
  activityLogs,
  statistics,
  antiBanRules,
  proxyConfigs
} from "./db/schema";
export * from "./db/schema";
import { schema } from "./db/schema";
let _db = null;
let _client = null;
async function getDb() {
  const url = Secrets.getDatabaseUrl();
  if (!_db && url) {
    try {
      _client = postgres(url, {
        connect_timeout: 30,
        idle_timeout: 20,
        max: 10,
        ssl: "require"
      });
      _db = drizzle(_client, { schema });
      await _client`SELECT 1`;
      console.log("[Database] Connected successfully to PostgreSQL:", url.replace(/\/\/.*@/, "//***@"));
    } catch (error) {
      const errorMsg = error.message || String(error);
      if (error.code === "28P01") {
        console.error("[Database] AUTHENTICATION FAILED: The password for your database is incorrect. Please check DATABASE_URL in Render dashboard.");
      } else if (error.code === "ECONNREFUSED" || error.message?.includes("ENOTFOUND")) {
        console.error("[Database] CONNECTION FAILED: Could not reach database server. Check if the database URL is correct and the server is accessible.");
      } else {
        console.warn("[Database] Failed to connect:", errorMsg);
        if (error.stack) console.debug(error.stack);
      }
      _db = null;
      _client = null;
    }
  }
  return _db;
}
async function closeDb() {
  if (_client) {
    await _client.end();
    _db = null;
    _client = null;
    console.log("[Database] Connection closed");
  }
}
const db = new Proxy({}, {
  get() {
    throw new Error("Database not initialized. Use getDb() to get database instance.");
  }
});
async function createUser(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(users).values(data).returning();
}
async function getUserByEmail(email) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}
async function getUserById(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}
async function getActiveAccountsCount() {
  const database = await getDb();
  if (!database) return 0;
  const result = await database.execute(sql`SELECT count(*) as count FROM telegram_accounts WHERE is_active = true`);
  return Number(result[0]?.count) || 0;
}
async function getOperationsCountToday() {
  const database = await getDb();
  if (!database) return 0;
  const result = await database.execute(sql`SELECT count(*) as count FROM activity_logs WHERE created_at >= ${new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0))}`);
  return Number(result[0]?.count) || 0;
}
async function createTelegramAccount(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const encryptedData = {
    ...data,
    sessionString: encryptString(data.sessionString)
  };
  return db2.insert(telegramAccounts).values(encryptedData).returning();
}
async function getTelegramAccountsByUserId(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const accounts = await db2.select().from(telegramAccounts).where(eq(telegramAccounts.userId, userId));
  return accounts.map((account) => ({
    ...account,
    sessionString: decryptString(account.sessionString)
  }));
}
async function getTelegramAccountById(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.select().from(telegramAccounts).where(eq(telegramAccounts.id, id)).limit(1);
  if (result.length > 0) {
    return {
      ...result[0],
      sessionString: decryptString(result[0].sessionString)
    };
  }
  return null;
}
async function updateTelegramAccount(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const updateData = data.sessionString ? { ...data, sessionString: encryptString(data.sessionString) } : data;
  return db2.update(telegramAccounts).set(updateData).where(eq(telegramAccounts.id, id)).returning();
}
async function deleteTelegramAccount(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.delete(telegramAccounts).where(eq(telegramAccounts.id, id));
}
async function createExtractedMembers(members) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(extractedMembers).values(members).returning();
}
async function getExtractedMembersByAccountAndGroup(userId, groupId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(extractedMembers).where(
    and(eq(extractedMembers.userId, userId), eq(extractedMembers.sourceGroupId, groupId))
  );
}
async function getExtractedMembersByUserId(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(extractedMembers).where(eq(extractedMembers.userId, userId));
}
async function getTotalExtractedMembersByUserId(userId) {
  const db2 = await getDb();
  if (!db2) return 0;
  const result = await db2.execute(sql`SELECT count(*) as count FROM extracted_members WHERE user_id = ${userId}`);
  return Number(result[0]?.count) || 0;
}
async function createBulkOperation(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.insert(bulkOperations).values(data).returning();
  return result[0];
}
async function getBulkOperationsByUserId(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(bulkOperations).where(eq(bulkOperations.userId, userId));
}
async function getBulkOperationById(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(bulkOperations).where(eq(bulkOperations.id, id)).limit(1);
}
async function updateBulkOperation(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.update(bulkOperations).set(data).where(eq(bulkOperations.id, id)).returning();
  return result[0];
}
async function createActivityLog(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(activityLogs).values(data).returning();
}
async function getActivityLogsByUserId(userId, limit = 50) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(activityLogs).where(eq(activityLogs.userId, userId)).limit(limit);
}
async function getStatisticsByUserId(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(statistics).where(eq(statistics.userId, userId));
}
async function getStatisticsByDate(userId, date) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(statistics).where(
    and(eq(statistics.userId, userId), eq(statistics.date, new Date(date)))
  ).limit(1);
}
async function getAntiBanRules(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.select().from(antiBanRules).where(eq(antiBanRules.userId, userId)).limit(1);
  return result[0] || null;
}
async function createAntiBanRules(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(antiBanRules).values(data).returning();
}
async function getRateLimitTracking(userId, actionType) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const result = await db2.select().from(statistics).where(
    and(eq(statistics.userId, userId), gte(statistics.date, today))
  ).limit(1);
  if (result.length > 0) {
    return {
      ...result[0],
      count: result[0].messagesSent || 0
    };
  }
  return null;
}
async function createRateLimitTracking(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(statistics).values({
    userId: data.userId || data.accountId,
    date: /* @__PURE__ */ new Date(),
    messagesSent: data.count
  }).returning();
}
async function updateRateLimitTracking(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.update(statistics).set({
    messagesSent: data.count
  }).where(eq(statistics.id, id)).returning();
}
async function getAllProxyConfigs() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(proxyConfigs);
}
async function getProxyConfigsByAccountId(userId) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(proxyConfigs).where(eq(proxyConfigs.userId, userId));
}
async function getProxyConfig(id) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const result = await db2.select().from(proxyConfigs).where(eq(proxyConfigs.id, id)).limit(1);
  return result[0] || null;
}
async function updateProxyConfig(id, data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.update(proxyConfigs).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(proxyConfigs.id, id)).returning();
}
async function getActiveProxyConfigs() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(proxyConfigs).where(eq(proxyConfigs.health, "healthy"));
}
async function createProxyConfig(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(proxyConfigs).values(data).returning();
}
async function createOperationResult(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.insert(activityLogs).values({
    userId: data.userId || data.accountId,
    action: data.operationType || data.action,
    status: data.success ? "success" : "error",
    details: JSON.stringify(data),
    timestamp: /* @__PURE__ */ new Date()
  }).returning();
}
async function getOperationResults(userId, since) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const results = await db2.select().from(activityLogs).where(
    and(eq(activityLogs.userId, userId), gte(activityLogs.timestamp, since))
  ).orderBy(desc(activityLogs.timestamp));
  return results.map((row) => {
    let details = {};
    try {
      details = row.details ? JSON.parse(row.details) : {};
    } catch (e) {
      console.error("Failed to parse activity log details:", e);
    }
    return {
      ...row,
      ...details,
      success: row.status === "success"
    };
  });
}
async function getRecentOperationResults(limit) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const results = await db2.select().from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(limit);
  return results.map((row) => {
    let details = {};
    try {
      details = row.details ? JSON.parse(row.details) : {};
    } catch (e) {
      console.error("Failed to parse activity log details:", e);
    }
    return {
      ...row,
      ...details,
      success: row.status === "success"
    };
  });
}
async function deleteOldOperationResults(cutoff) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.delete(activityLogs).where(lte(activityLogs.timestamp, cutoff));
}
async function deleteOldRateLimitTracking(cutoff) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.delete(statistics).where(lte(statistics.date, cutoff));
}
async function getAllTelegramAccounts() {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  return db2.select().from(telegramAccounts);
}
async function getTelegramAccount(id) {
  return getTelegramAccountById(id);
}
const getProxyConfigsByUserId = getProxyConfigsByAccountId;
const getActivityLogsByAccountId = getActivityLogsByUserId;
const getBulkOperationsByAccountId = (userId) => getBulkOperationsByUserId(userId);
async function upsertUser(data) {
  const db2 = await getDb();
  if (!db2) throw new Error("Database not connected");
  const existing = await getUserByEmail(data.email);
  if (existing) {
    return db2.update(users).set(data).where(eq(users.email, data.email)).returning();
  }
  return db2.insert(users).values(data).returning();
}
async function getOrCreateStatistics(userId, date) {
  const database = await getDb();
  if (!database) throw new Error("Database not connected");
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const existing = await database.select().from(statistics).where(
    and(
      eq(statistics.userId, userId),
      eq(statistics.date, targetDate)
    )
  ).limit(1);
  if (existing.length > 0) {
    const s = existing[0];
    return {
      date: s.date,
      messagesSent: s.messagesSent || 0,
      messagesFailed: s.errors || 0,
      membersExtracted: s.membersAdded || 0,
      // Using membersAdded as a fallback for membersExtracted
      groupsJoined: 0,
      usersAdded: s.membersAdded || 0,
      groupsLeft: 0,
      successRate: s.operationsCompleted ? Math.round((s.messagesSent || 0) / s.operationsCompleted * 100) : 0
    };
  }
  const [newStats] = await database.insert(statistics).values({
    userId,
    date: targetDate,
    messagesSent: 0,
    membersAdded: 0,
    operationsCompleted: 0,
    errors: 0
  }).returning();
  return {
    date: newStats.date,
    messagesSent: 0,
    messagesFailed: 0,
    membersExtracted: 0,
    groupsJoined: 0,
    usersAdded: 0,
    groupsLeft: 0,
    successRate: 0
  };
}
export {
  and,
  asc,
  closeDb,
  createActivityLog,
  createAntiBanRules,
  createBulkOperation,
  createExtractedMembers,
  createOperationResult,
  createProxyConfig,
  createRateLimitTracking,
  createTelegramAccount,
  createUser,
  db,
  deleteOldOperationResults,
  deleteOldRateLimitTracking,
  deleteTelegramAccount,
  desc,
  eq,
  getActiveAccountsCount,
  getActiveProxyConfigs,
  getActivityLogsByAccountId,
  getActivityLogsByUserId,
  getAllProxyConfigs,
  getAllTelegramAccounts,
  getAntiBanRules,
  getBulkOperationById,
  getBulkOperationsByAccountId,
  getBulkOperationsByUserId,
  getDb,
  getExtractedMembersByAccountAndGroup,
  getExtractedMembersByUserId,
  getOperationResults,
  getOperationsCountToday,
  getOrCreateStatistics,
  getProxyConfig,
  getProxyConfigsByAccountId,
  getProxyConfigsByUserId,
  getRateLimitTracking,
  getRecentOperationResults,
  getStatisticsByDate,
  getStatisticsByUserId,
  getTelegramAccount,
  getTelegramAccountById,
  getTelegramAccountsByUserId,
  getTotalExtractedMembersByUserId,
  getUserByEmail,
  getUserById,
  gte,
  like,
  lte,
  sql,
  updateBulkOperation,
  updateProxyConfig,
  updateRateLimitTracking,
  updateTelegramAccount,
  upsertUser
};
