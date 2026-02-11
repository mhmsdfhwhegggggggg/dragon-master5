/**
 * Database Wrapper - Supports both SQLite and PostgreSQL
 * Automatically detects which database to use based on connection string
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../drizzle/schema-postgres";
import * as schemaSqlite from "../drizzle/schema-sqlite";
import { Secrets } from "./_core/secrets";
import { encryptString, decryptString } from "./_core/crypto";

// Determine which database to use based on connection string
const getDatabaseType = (): 'sqlite' | 'postgres' => {
  const dbUrl = Secrets.getDatabaseUrl() || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return 'sqlite'; // Default to SQLite
  }
  
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgres';
  }
  
  return 'sqlite';
};

// Initialize database connection based on type
let db: any;
let client: any;

export async function getDb() {
  const dbType = getDatabaseType();
  
  if (dbType === 'postgres' && !db) {
    // PostgreSQL connection
    const connectionString = Secrets.getDatabaseUrl() || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("PostgreSQL connection string is required");
    }
    
    client = postgres(connectionString, {
      max: 20,
      idle_timeout: 20000,
      connect_timeout: 10000,
    });
    
    db = drizzle(client, { schema });
    console.log("[Database] Connected to PostgreSQL");
    
  } else if (dbType === 'sqlite' && !db) {
    // SQLite connection
    const dbPath = (Secrets.getDatabaseUrl() || process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "");
    _client = new Database(dbPath);
    db = drizzleSqlite(_client, { schema: schemaSqlite });
    console.log("[Database] Connected to SQLite:", dbPath);
  }
  
  return db;
}

// Export database instance and type
export { db as Database };

// Type exports for both schemas
export type { User, TelegramAccount, ExtractedMember, BulkOperation, Statistics, ProxyConfig } from "../drizzle/schema-postgres";
export type { User as UserSqlite, TelegramAccount as TelegramAccountSqlite, ExtractedMember as ExtractedMemberSqlite, BulkOperation as BulkOperationSqlite, Statistics as StatisticsSqlite, ProxyConfig as ProxyConfigSqlite } from "../drizzle/schema-sqlite";

// Helper functions that work with both databases
export async function createUser(userData: any) {
  const db = await getDb();
  const [user] = await db.insert(schema.users || schemaSqlite.users).values(userData).returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const { eq } = await import("drizzle-orm");
  const [user] = await db.select().from(schema.users || schemaSqlite.users).where(eq((schema.users || schemaSqlite.users).email, email));
  return user;
}

export async function getTelegramAccountById(id: number) {
  const db = await getDb();
  const [account] = await db.select().from(schema.telegramAccounts || schemaSqlite.telegramAccounts).where((eq: (table: any) => table.id === id));
  
  if (account && 'sessionString' in account) {
    account.sessionString = decryptString(account.sessionString);
  }
  
  return account;
}

export async function createTelegramAccount(accountData: any) {
  const db = await getDb();
  const encryptedSessionString = encryptString(accountData.sessionString);
  
  const [account] = await db.insert(schema.telegramAccounts || schemaSqlite.telegramAccounts).values({
    ...accountData,
    sessionString: encryptedSessionString
  }).returning();
  return account;
}

export async function updateTelegramAccount(id: number, accountData: any) {
  const db = await getDb();
  const updateData: any = { ...accountData, updatedAt: new Date() };
  
  if (accountData.sessionString) {
    updateData.sessionString = encryptString(accountData.sessionString);
  }
  
  const [account] = await db
    .update(schema.telegramAccounts || schemaSqlite.telegramAccounts)
    .set(updateData)
    .where((eq: (table: any) => table.id === id))
    .returning();
    
  if (account && 'sessionString' in account) {
    account.sessionString = decryptString(account.sessionString);
  }
  
  return account;
}

export async function createExtractedMember(memberData: any) {
  const db = await getDb();
  const [member] = await db.insert(schema.extractedMembers || schemaSqlite.extractedMembers).values(memberData).returning();
  return member;
}

export async function createBulkOperation(operationData: any) {
  const db = await getDb();
  const [operation] = await db.insert(schema.bulkOperations || schemaSqlite.bulkOperations).values(operationData).returning();
  return operation;
}

export async function createStatistics(statsData: any) {
  const db = await getDb();
  const [stats] = await db.insert(schema.statistics || schemaSqlite.statistics).values(statsData).returning();
  return stats;
}

export async function checkDatabaseHealth() {
  try {
    const db = await getDb();
    await db.select().from(schema.users || schemaSqlite.users).limit(1);
    return { status: 'healthy', message: 'Database connection successful', type: getDatabaseType() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: getDatabaseType()
    };
  }
}

// Migration helper
export async function runMigrations() {
  const dbType = getDatabaseType();
  console.log(`[Database] Running migrations for ${dbType}...`);
  
  if (dbType === 'postgres') {
    // PostgreSQL migrations
    const { drizzleKit } = await import("drizzle-kit");
    const { migrate } = drizzleKit;
    await migrate({ config: "drizzle/config-postgres.ts" });
  } else {
    // SQLite migrations
    const { drizzleKit } = await import("drizzle-kit");
    const { migrate } = drizzleKit;
    await migrate({ config: "drizzle.config.ts" });
  }
}

// Export database type for checking
export function getDatabaseType(): 'sqlite' | 'postgres' {
  const dbUrl = Secrets.getDatabaseUrl() || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return 'sqlite';
  }
  
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgres';
  }
  
  return 'sqlite';
}
