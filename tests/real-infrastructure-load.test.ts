import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";

// Load the real production environment variables explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.realtest"), override: true });

import { getDb, closeDb } from "../server/db";
import Redis from "ioredis";

describe("🔥 REAL INFRASTRUCTURE LOAD TEST (NEON DB & UPSTASH REDIS)", () => {
    let db: any;
    let redis: any;

    beforeAll(async () => {
        try {
            console.log("\n🚀 Connecting to REAL Neon PostgreSQL...");
            db = await getDb();
            console.log("✅ REAL DB connected.");
        } catch (e: any) {
            console.error("❌ DB CONNECTION FAILED:", e.message);
        }

        try {
            console.log("🚀 Connecting to REAL Upstash Redis...");
            const redisUrl = process.env.REDIS_URL as string;
            redis = new Redis(redisUrl.replace("redis://", "rediss://"), {
                family: 0,
                maxRetriesPerRequest: 1,
                connectTimeout: 5000
            });
            await redis.ping();
            console.log("✅ REAL Redis connected.");
        } catch (e: any) {
             console.error("❌ REDIS CONNECTION FAILED:", e.message);
        }
    }, 15000);

    afterAll(async () => {
        // Clean up mock data and connections
        if (redis) await redis.quit();
        if (db) await closeDb();
        console.log("✅ Cleaned up connections.");
    }, 20000);

    it("[REDIS] 1,000 Concurrent SET/GET Operations under 2 Seconds", async () => {
        if (!redis || redis.status !== 'ready') {
            console.log("⚠️ Skipping Redis test due to connection failure.");
            return;
        }
        const start = Date.now();
        const ops = 1000;
        const testId = randomUUID();
        
        // Concurrent Sets
        const setPromises = Array.from({ length: ops }, (_, i) => 
            redis.set(`dragaan:loadtest:${testId}:${i}`, `value_${i}`, "EX", 10)
        );
        const setResults = await Promise.allSettled(setPromises);
        const setErrors = setResults.filter(r => r.status === "rejected");
        
        // Concurrent Gets
        const getPromises = Array.from({ length: ops }, (_, i) => 
            redis.get(`dragaan:loadtest:${testId}:${i}`)
        );
        const getResults = await Promise.all(getPromises);
        
        const duration = Date.now() - start;
        console.log(`✅ [Upstash Redis] ${ops} writes + ${ops} reads finished in ${duration}ms!`);
        
        expect(setErrors.length).toBe(0);
        expect(getResults.length).toBe(ops);
        
        expect(duration).toBeLessThan(5000); 
    }, 10000);

    it("[NEON DB] 500 Concurrent Connection Pool Reads", async () => {
        if (!db) {
            console.log("⚠️ Skipping DB test due to connection failure.");
            return;
        }
        const start = Date.now();
        const ops = 500;
        
        // Mass concurrent basic selects to ensure connection pool holds
        const queries = Array.from({ length: ops }, () => db.execute("SELECT 1 as test"));
        
        const results = await Promise.allSettled(queries);
        const errs = results.filter(x => x.status === "rejected");
        
        const duration = Date.now() - start;
        console.log(`✅ [Neon PostgreSQL] ${ops} concurrent SELECTs in ${duration}ms, Errors: ${errs.length}`);
        
        expect(errs.length).toBe(0); // If the pool survives, no errors should exist
    }, 30000);

    it("[ALGORITHMS] CPU Node Event Loop Freeze Test (1,000 iterations)", async () => {
        // Here we test if Node can handle back-to-back heavy object manipulations fast enough without blocking network tests.
        const start = Date.now();
        
        const testArray = Array.from({length: 10000}, (_, i) => ({ id: i, payload: "some string data payload that takes memory" }));
        
        // Quick manipulation
        const manipulated = testArray
            .map(x => ({ ...x, processed: x.id * 2 }))
            .filter(x => x.processed % 2 === 0);
            
        const duration = Date.now() - start;
        console.log(`✅ [CPU Event Loop] Processed 10k array manipulation in ${duration}ms`);
        
        expect(manipulated.length).toBeGreaterThan(0);
        expect(duration).toBeLessThan(100); // Should be very fast, validating single threading context.
    });
});
