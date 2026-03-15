import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock date for time manipulation
const originalDateNow = Date.now;

vi.mock("../server/db", () => ({
    getTelegramAccountById: vi.fn().mockResolvedValue({ id: 1, deviceSignature: "sig_1" }),
    updateTelegramAccount: vi.fn(),
    getDb: vi.fn().mockResolvedValue({
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) }),
        select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }) }),
    }),
    getActivityLogsByAccountId: vi.fn().mockResolvedValue([]),
    getAccountOperationDailyStats: vi.fn().mockResolvedValue({ count: 0 }),
    learningData: { accountId: 1, operationType: "add_member", timestamp: Date.now(), features: {}, outcome: "success" },
    activityLogs: {},
}));

vi.mock("../server/_core/cache-system", () => ({
    CacheSystem: {
        getInstance: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(true),
        })
    }
}));

describe("Anti-Ban Durability Simulation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.Date.now = originalDateNow;
    });

    it("should generate a stop recommendation when extreme activity is detected", async () => {
        const { AntiBanEngineV5 } = await import("../server/services/anti-ban-engine-v5");
        const engine = AntiBanEngineV5.getInstance();

        const accountId = 1;
        
        // Force EXTREME activity metrics to trigger risk
        vi.spyOn(engine as any, "getOperationsInLastHour").mockResolvedValue(1000);
        vi.spyOn(engine as any, "getOperationsInLastDay").mockResolvedValue(10000);
        
        // Mock ML to see lots of failures
        (engine as any).learningData = Array.from({length: 20}).map(() => ({
            accountId: 1,
            operationType: 'add_member',
            features: { operationFeatures: { mediaType: 'text' }, timingFeatures: { hourOfDay: 14 } },
            outcome: 'rate_limited'
        }));

        const recommendation = await engine.analyzeOperation({
            accountId,
            operationType: "add_member",
            speed: "fast",
            timeOfDay: 14,
            dayOfWeek: 2,
            accountAge: 5, // Very young
            recentActivityCount: 500,
        });

        // With extreme hourly/daily ops + young account + failed ML history, risk score should be 100
        expect(recommendation.riskScore).toBeGreaterThan(85);
        expect(recommendation.action).toBe("stop_operation");
    }, 20000);
    
});
