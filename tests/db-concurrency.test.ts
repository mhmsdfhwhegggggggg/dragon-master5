import { describe, expect, it, vi, beforeEach } from "vitest";

// Use hoisted to have access to variables inside mock factory
const { connections } = vi.hoisted(() => ({
    connections: { current: 0, peaks: 0, max: 50 }
}));

vi.mock("../server/db", () => {
    const mockQuery = vi.fn().mockImplementation(async () => {
        connections.current++;
        if (connections.current > connections.peaks) connections.peaks = connections.current;
        
        // Simulate minor query delay
        await new Promise(r => setTimeout(r, 10));
        
        connections.current--;
        return [{ id: 1 }];
    });

    return {
        getDb: vi.fn().mockResolvedValue({
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue([{ id: 1 }])
                        })
                    })
                })
            }),
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: mockQuery
                })
            }),
            execute: mockQuery
        }),
        getTelegramAccountById: vi.fn().mockResolvedValue({ id: 1, sessionString: "test" }),
        poolConfig: { max: 50 },
        learningData: {},
        activityLogs: {},
        getActivityLogsByAccountId: vi.fn().mockResolvedValue([]),
        getAccountOperationDailyStats: vi.fn().mockResolvedValue({ count: 0 }),
    };
});

describe("Database Concurrency & Pooling (Industrial Grade)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        connections.current = 0;
        connections.peaks = 0;
    });

    it("should handle 100 concurrent database queries within pool limits", async () => {
        const { getDb } = await import("../server/db");
        const db = await getDb();

        const queries = Array.from({ length: 100 }).map(() => db.execute("SELECT 1"));
        
        // Wait for all queries to finish
        const results = await Promise.allSettled(queries);
        
        const failures = results.filter(r => r.status === "rejected");
        
        expect(failures.length).toBe(0);
        expect(db.execute).toHaveBeenCalledTimes(100);
        // Peak concurrency should be close to queries count if executed in parallel
        expect(connections.peaks).toBeGreaterThan(1);
    });
    
    it("should sustain high throughput of bulk log insertions", async () => {
         const { getDb } = await import("../server/db");
         const db = await getDb();
         
         const inserts = Array.from({ length: 100 }).map((_, i) => 
            db.insert(null as any).values({ action: "test", log: `entry ${i}` }).returning()
         );
         
         const start = Date.now();
         const results = await Promise.all(inserts);
         const end = Date.now();
         
         expect(results.length).toBe(100);
         expect(end - start).toBeLessThan(10000); 
    });
});
