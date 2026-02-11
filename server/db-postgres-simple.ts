/**
 * PostgreSQL Database Connection - Simple Version
 * Production-ready PostgreSQL database with connection pooling
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema-postgres";
import { Secrets } from "./_core/secrets";
import { encryptString, decryptString } from "./_core/crypto";
import { eq, and, desc, gte } from "drizzle-orm";

// Connection configuration
const connectionString = Secrets.getDatabaseUrl() || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("PostgreSQL connection string is required. Please set DATABASE_URL in environment or secrets.");
}

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20000,
  connect_timeout: 10000,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Database helper functions
export async function getDb() {
  return db;
}

/**
 * User management functions
 */
export async function createUser(userData: Omit<typeof schema.User, "id" | "createdAt" | "updatedAt">) {
  const [user] = await db.insert(schema.users).values(userData).returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  return user;
}

export async function getUserByUsername(username: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
  return user;
}

export async function updateUser(id: number, userData: Partial<Omit<typeof schema.User, "id" | "createdAt" | "updatedAt">>) {
  const [user] = await db
    .update(schema.users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning();
  return user;
}

/**
 * Telegram account management functions
 */
export async function createTelegramAccount(accountData: Omit<typeof schema.TelegramAccount, "id" | "createdAt" | "updatedAt">) {
  // Encrypt session string before storing
  const encryptedSessionString = encryptString(accountData.sessionString);
  
  const [account] = await db
    .insert(schema.telegramAccounts)
    .values({ ...accountData, sessionString: encryptedSessionString })
    .returning();
  return account;
}

export async function getTelegramAccountById(id: number) {
  const [account] = await db.select().from(schema.telegramAccounts).where(eq(schema.telegramAccounts.id, id));
  
  if (account) {
    // Decrypt session string for use
    account.sessionString = decryptString(account.sessionString);
  }
  
  return account;
}

export async function getTelegramAccountsByUserId(userId: number) {
  const accounts = await db
    .select()
    .from(schema.telegramAccounts)
    .where(eq(schema.telegramAccounts.userId, userId));
  
  // Decrypt session strings
  return accounts.map(account => ({
    ...account,
    sessionString: decryptString(account.sessionString),
  }));
}

export async function updateTelegramAccount(id: number, accountData: Partial<Omit<typeof schema.TelegramAccount, "id" | "createdAt" | "updatedAt">>) {
  const updateData: any = { ...accountData, updatedAt: new Date() };
  
  // Encrypt session string if provided
  if (accountData.sessionString) {
    updateData.sessionString = encryptString(accountData.sessionString);
  }
  
  const [account] = await db
    .update(schema.telegramAccounts)
    .set(updateData)
    .where(eq(schema.telegramAccounts.id, id))
    .returning();
  
  if (account) {
    // Decrypt session string for use
    account.sessionString = decryptString(account.sessionString);
  }
  
  return account;
}

export async function deleteTelegramAccount(id: number) {
  const [account] = await db
    .delete(schema.telegramAccounts)
    .where(eq(schema.telegramAccounts.id, id))
    .returning();
  return account;
}

/**
 * Extracted members management functions
 */
export async function createExtractedMember(memberData: Omit<typeof schema.ExtractedMember, "id" | "extractedAt">) {
  const [member] = await db.insert(schema.extractedMembers).values(memberData).returning();
  return member;
}

export async function createExtractedMembers(membersData: Omit<typeof schema.ExtractedMember, "id" | "extractedAt">[]) {
  const members = await db.insert(schema.extractedMembers).values(membersData).returning();
  return members;
}

export async function getExtractedMembersByAccount(accountId: number, limit = 100) {
  return await db
    .select()
    .from(schema.extractedMembers)
    .where(eq(schema.extractedMembers.accountId, accountId))
    .limit(limit);
}

export async function getExtractedMembersBySource(sourceGroupId: string, limit = 1000) {
  return await db
    .select()
    .from(schema.extractedMembers)
    .where(eq(schema.extractedMembers.sourceGroupId, sourceGroupId))
    .limit(limit);
}

/**
 * Bulk operations management functions
 */
export async function createBulkOperation(operationData: Omit<typeof schema.BulkOperation, "id" | "createdAt" | "startedAt" | "completedAt">) {
  const [operation] = await db.insert(schema.bulkOperations).values(operationData).returning();
  return operation;
}

export async function getBulkOperationsByUserId(userId: number) {
  return await db
    .select()
    .from(schema.bulkOperations)
    .where(eq(schema.bulkOperations.userId, userId))
    .orderBy(desc(schema.bulkOperations.createdAt));
}

export async function updateBulkOperation(id: number, operationData: Partial<Omit<typeof schema.BulkOperation, "id" | "createdAt" | "startedAt" | "completedAt">>) {
  const [operation] = await db
    .update(schema.bulkOperations)
    .set(operationData)
    .where(eq(schema.bulkOperations.id, id))
    .returning();
  return operation;
}

/**
 * Statistics functions
 */
export async function createStatistics(statsData: Omit<typeof schema.Statistics, "id" | "createdAt">) {
  const [stats] = await db.insert(schema.statistics).values(statsData).returning();
  return stats;
}

export async function getStatisticsByUserId(userId: number, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await db
    .select()
    .from(schema.statistics)
    .where(
      and(
        eq(schema.statistics.userId, userId),
        gte(schema.statistics.date, startDate.toISOString().split('T')[0])
      )
    )
    .orderBy(desc(schema.statistics.date));
}

/**
 * Proxy configuration functions
 */
export async function createProxyConfig(proxyData: Omit<typeof schema.ProxyConfig, "id" | "createdAt">) {
  const [proxy] = await db.insert(schema.proxyConfigs).values(proxyData).returning();
  return proxy;
}

export async function getProxyConfigsByAccount(accountId: number) {
  return await db
    .select()
    .from(schema.proxyConfigs)
    .where(and(eq(schema.proxyConfigs.accountId, accountId), eq(schema.proxyConfigs.isActive, true)));
}

/**
 * Database health check
 */
export async function checkDatabaseHealth() {
  try {
    await db.select().from(schema.users).limit(1);
    return { status: 'healthy', message: 'PostgreSQL connection successful' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Initialize database with default data
 */
export async function initializeDatabase() {
  try {
    // Check if users table exists and has data
    const existingUsers = await db.select().from(schema.users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('[PostgreSQL] Initializing with default data...');
      
      // Create default admin user (in production, this should be done via setup process)
      const adminUser = await createUser({
        email: 'admin@dragaan.pro',
        username: 'admin',
        passwordHash: '$2b$10$placeholder_hash_change_in_production', // This should be properly hashed
        isActive: true,
      });
      
      console.log('[PostgreSQL] Default admin user created:', adminUser.email);
    }
    
    console.log('[PostgreSQL] Initialization completed successfully');
  } catch (error) {
    console.error('[PostgreSQL] Initialization failed:', error);
    throw error;
  }
}
