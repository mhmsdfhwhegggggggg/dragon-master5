/**
 * ============================================================
 * REAL DATABASE INTEGRATION TEST — Neon PostgreSQL
 * ✅ 100% Real — No mocks — Direct live connection
 * ============================================================
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

import { getDb, closeDb, createUser, getUserByEmail, getUserById, getActiveAccountsCount } from "../server/db";

const TEST_EMAIL = `int_test_${Date.now()}@falcon.test`;
const TEST_USER  = `falcon_${Date.now()}`;
let testUserId = 0;

describe("🔌 REAL Database Integration — Neon PostgreSQL", () => {

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Cannot connect to Neon PostgreSQL — check DATABASE_URL in .env.test");
    console.log("✅ Connected to Neon PostgreSQL");
  }, 30000);

  afterAll(async () => {
    if (testUserId) {
      const db = await getDb() as any;
      await db?.execute(`DELETE FROM users WHERE id = ${testUserId}`).catch(() => {});
    }
    await closeDb();
  }, 20000);

  it("SELECT 1 — verifies live connection", async () => {
    const db = await getDb() as any;
    const r = await db.execute("SELECT 1 AS ok");
    expect(Number(r[0].ok)).toBe(1);
  });

  it("INSERT user — real write to DB", async () => {
    const r = await createUser({ username: TEST_USER, email: TEST_EMAIL, password: "hash", role: "user", isActive: true });
    testUserId = r[0].id;
    expect(testUserId).toBeGreaterThan(0);
    console.log(`✅ User created: id=${testUserId}`);
  });

  it("SELECT by email — confirms insert persisted", async () => {
    const u = await getUserByEmail(TEST_EMAIL);
    expect(u?.email).toBe(TEST_EMAIL);
  });

  it("SELECT by ID — confirms row is retrievable", async () => {
    const u = await getUserById(testUserId);
    expect(u?.id).toBe(testUserId);
  });

  it("NULL result — non-existent user returns null", async () => {
    const u = await getUserById(999_999_999);
    expect(u).toBeNull();
  });

  it("COUNT active accounts — schema query works", async () => {
    const count = await getActiveAccountsCount();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`✅ Active accounts: ${count}`);
  });

  it("activity_logs timestamp column — schema validation", async () => {
    const db = await getDb() as any;
    const today = new Date(); today.setHours(0,0,0,0);
    const r = await db.execute(
      `SELECT COUNT(*) AS cnt FROM activity_logs WHERE timestamp >= '${today.toISOString()}'`
    );
    expect(Number(r[0].cnt)).toBeGreaterThanOrEqual(0);
    console.log(`✅ Today's activity_log rows: ${r[0].cnt}`);
  });

  it("50 concurrent reads — pool does not exhaust", async () => {
    const ps = Array.from({length:50}, (_,i) => getUserById(i+1));
    const start = Date.now();
    const results = await Promise.allSettled(ps);
    const ms = Date.now() - start;
    const errs = results.filter(r => r.status === "rejected");
    console.log(`✅ 50 concurrent reads in ${ms}ms — ${errs.length} errors`);
    expect(errs.length).toBe(0);
  }, 65000);

  it("100 concurrent reads — heavy pool stress", async () => {
    const ps = Array.from({length:100}, (_,i) => getUserById(i+1));
    const start = Date.now();
    const results = await Promise.allSettled(ps);
    const ms = Date.now() - start;
    const errs = results.filter(r => r.status === "rejected");
    console.log(`✅ 100 concurrent reads in ${ms}ms — ${errs.length} errors`);
    expect(errs.length).toBe(0);
  }, 65000);
});
