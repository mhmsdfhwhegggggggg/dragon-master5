/**
 * ============================================================
 * FULL STACK CONCURRENCY LOAD TEST
 * ✅ Real Neon PostgreSQL — 200 concurrent reads
 * ✅ In-Memory Redis Mock — 200 concurrent writes (no network needed)
 * ✅ Mixed DB + Cache workflow simulation
 * ============================================================
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

import { getDb, closeDb, getUserById } from "../server/db";

// ── In-memory Redis mock for concurrent operations ───────────────────────────
class FastRedis {
  private store = new Map<string, string>();
  async set(k: string, v: string) { this.store.set(k, v); return "OK"; }
  async get(k: string)  { return this.store.get(k) ?? null; }
  async del(k: string)  { this.store.delete(k); }
  async incr(k: string) {
    const v = (Number(this.store.get(k) ?? 0)) + 1;
    this.store.set(k, String(v));
    return v;
  }
  async flush() { this.store.clear(); }
  get size() { return this.store.size; }
}

const cache = new FastRedis();

describe("💥 Full-Stack Concurrency & Load Tests", () => {

  beforeAll(async () => {
    console.log("\n🚀 Connecting to Neon PostgreSQL for load test...");
    const db = await getDb();
    if (!db) throw new Error("❌ DB unavailable");
    console.log("✅ DB ready.");
  }, 30000);

  afterAll(async () => {
    await closeDb();
    await cache.flush();
    console.log("✅ Cleanup done.");
  }, 20000);

  it("DB: 50 concurrent reads — no connection pool exhaustion", async () => {
    const ps = Array.from({length:50}, (_,i) => getUserById(i+1));
    const r  = await Promise.allSettled(ps);
    const errs = r.filter(x => x.status === "rejected");
    console.log(`✅ 50 reads — ${errs.length} errors`);
    expect(errs.length).toBe(0);
  }, 65000);

  it("DB: 200 concurrent reads — heavy pool stress", async () => {
    const ps = Array.from({length:200}, (_,i) => getUserById(i+1));
    const start = Date.now();
    const r = await Promise.allSettled(ps);
    const ms = Date.now() - start;
    const errs = r.filter(x => x.status === "rejected");
    console.log(`✅ 200 concurrent reads in ${ms}ms — ${errs.length} errors`);
    expect(errs.length).toBe(0);
  }, 65000);

  it("Cache: 500 concurrent SET operations — zero failures", async () => {
    const ops = Array.from({length:500}, (_,i) => cache.set(`k${i}`, `v${i}`));
    const r = await Promise.allSettled(ops);
    expect(r.filter(x => x.status === "rejected").length).toBe(0);
    expect(cache.size).toBeGreaterThanOrEqual(500);
  });

  it("Cache: 500 concurrent GET operations — zero misses", async () => {
    const reads = await Promise.all(Array.from({length:500}, (_,i) => cache.get(`k${i}`)));
    const nulls = reads.filter(v => v === null).length;
    console.log(`✅ 500 cache reads — ${nulls} misses`);
    expect(nulls).toBe(0);
  });

  it("Mixed: 50 concurrent DB-read + cache-write chains", async () => {
    await cache.flush();
    const ops = Array.from({length:50}, async (_,i) => {
      const row = await getUserById(i + 1);
      await cache.set(`user:${i+1}`, JSON.stringify(row ?? { id: i+1 }));
      const hit = await cache.get(`user:${i+1}`);
      return !!hit;
    });
    const results = await Promise.allSettled(ops);
    const errs = results.filter(r => r.status === "rejected");
    console.log(`✅ Mixed DB+Cache workflow: ${50 - errs.length}/50 complete`);
    expect(errs.length).toBe(0);
  }, 65000);

  it("Atomic counter — 100 concurrent INCRs = exactly 100", async () => {
    await cache.flush();
    await Promise.all(Array.from({length:100}, () => cache.incr("ops:today")));
    expect(Number(await cache.get("ops:today"))).toBe(100);
  });

  it("Cache throughput — 1000 random read/write mix in <500ms", async () => {
    await cache.flush();
    const start = Date.now();
    await Promise.all(Array.from({length:1000}, async (_,i) => {
      if (i % 2 === 0) await cache.set(`t:${i}`, `val`);
      else await cache.get(`t:${i-1}`);
    }));
    const ms = Date.now() - start;
    console.log(`✅ 1000 mixed cache ops in ${ms}ms`);
    expect(ms).toBeLessThan(500);
  });
});
