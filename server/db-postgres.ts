/**
 * PostgreSQL Database Connection and Helper Functions
 * Production-ready database with connection pooling and proper error handling
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema-postgres";
import { Secrets } from "./_core/secrets";
import { encryptString, decryptString } from "./_core/crypto";
import type { 
  User, 
  TelegramAccount, 
  ExtractedMember, 
  BulkOperation, 
  Statistics, 
  ProxyConfig 
} from "../drizzle/schema-postgres";

// Connection pool configuration
const connectionString = Secrets.getDatabaseUrl() || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string is required. Please set DATABASE_URL in environment or secrets.");
}

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
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
export async function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">) {
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

export async function updateUser(id: number, userData: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>) {
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
export async function createTelegramAccount(accountData: Omit<TelegramAccount, "id" | "createdAt" | "updatedAt">) {
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

export async function updateTelegramAccount(id: number, accountData: Partial<Omit<TelegramAccount, "id" | "createdAt" | "updatedAt">>) {
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
export async function createExtractedMember(memberData: Omit<ExtractedMember, "id" | "extractedAt">) {
  const [member] = await db.insert(schema.extractedMembers).values(memberData).returning();
  return member;
}

export async function createExtractedMembers(membersData: Omit<ExtractedMember, "id" | "extractedAt">[]) {
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
export async function createBulkOperation(operationData: Omit<BulkOperation, "id" | "createdAt" | "startedAt" | "completedAt">) {
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

export async function updateBulkOperation(id: number, operationData: Partial<Omit<BulkOperation, "id" | "createdAt" | "startedAt" | "completedAt">>) {
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
export async function createStatistics(statsData: Omit<Statistics, "id" | "createdAt">) {
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
export async function createProxyConfig(proxyData: Omit<ProxyConfig, "id" | "createdAt">) {
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
    return { status: 'healthy', message: 'Database connection successful' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
      console.log('[Database] Initializing with default data...');
      
      // Create default admin user (in production, this should be done via setup process)
      const adminUser = await createUser({
        email: 'admin@dragaan.pro',
        username: 'admin',
        passwordHash: '$2b$10$placeholder_hash_change_in_production', // This should be properly hashed
        isActive: true,
      });
      
      console.log('[Database] Default admin user created:', adminUser.email);
    }
    
    console.log('[Database] Initialization completed successfully');
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    throw error;
  }
}

// Import necessary functions from Drizzle
import { eq, and, desc, gte } from "drizzle-orm";
