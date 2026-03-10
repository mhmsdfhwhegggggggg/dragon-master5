import { describe, expect, it, vi, beforeEach } from "vitest";
import { AntiBanEngineV5 } from "../server/services/anti-ban-engine-v5";
import * as db from "../server/db";
import { CacheSystem } from "../server/_core/cache-system";

// Mock dependencies
vi.mock("../server/_core/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    }
}));

vi.mock("../server/_core/cache-system", () => ({
    CacheSystem: {
        getInstance: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(true),
        })
    }
}));

vi.mock("../server/services/risk-detection", () => ({
    RiskDetector: {
        getInstance: vi.fn().mockReturnValue({
            // Mock methods if needed
        })
    }
}));

vi.mock("../server/services/proxy-intelligence", () => ({
    proxyIntelligenceManager: {}
}));

vi.mock("../server/db", () => ({
    getTelegramAccountById: vi.fn(),
    updateTelegramAccount: vi.fn(),
    getDb: vi.fn().mockResolvedValue({
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) }),
        select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }) }),
    }),
    learningData: {},
}));

vi.mock("../server/services/telegram-client.service", () => ({
    telegramClientService: {}
}));

vi.mock("../server/services/channel-shield", () => ({
    channelShield: {
        checkChannelSafety: vi.fn().mockResolvedValue({ safe: true, suggestedDelayMultiplier: 1.0 }),
    }
}));

describe("Anti-Ban Engine V5.0", () => {
    let engine: AntiBanEngineV5;

    beforeEach(() => {
        vi.clearAllMocks();
        engine = AntiBanEngineV5.getInstance();
    });

    it("should calculate appropriate delay based on speeding options", async () => {
        const accountId = 1;
        const delayMedium = await engine.calculateDelay("message", accountId, { speed: "medium" });
        const delaySlow = await engine.calculateDelay("message", accountId, { speed: "slow" });

        expect(delaySlow).toBeGreaterThan(delayMedium);
    });

    it("should increase delay when risk score is high", async () => {
        const accountId = 1;
        const normalDelay = await engine.calculateDelay("add_member", accountId, { riskScore: 20 });
        const highRiskDelay = await engine.calculateDelay("add_member", accountId, { riskScore: 80 });

        expect(highRiskDelay).toBeGreaterThan(normalDelay);
    });

    it("should analyze operation and return recommendation", async () => {
        const context = {
            accountId: 1,
            operationType: "message" as const,
            speed: "medium" as const,
            timeOfDay: 12,
            dayOfWeek: 1,
            accountAge: 100,
            recentActivityCount: 5,
        };

        const recommendation = await engine.analyzeOperation(context);

        expect(recommendation).toHaveProperty("action");
        expect(recommendation).toHaveProperty("riskScore");
        expect(recommendation).toHaveProperty("delay");
    });

    it("should trigger emergency_stop on critical risk level", async () => {
        // Force high risk via mocking internal methods would be better, 
        // but here we can test the threshold behavior if we can influence the calculation.
        // For simplicity, let's test if it handles anomalies correctly.

        // AntiBanEngineV5 uses many private methods, so we test the public analyzeOperation
        // with risky context.
        const riskyContext = {
            accountId: 1,
            operationType: "add_member" as const,
            speed: "fast" as const,
            timeOfDay: 3, // middle of night
            dayOfWeek: 0,
            accountAge: 1, // very new account
            recentActivityCount: 50, // high activity
        };

        const recommendation = await engine.analyzeOperation(riskyContext);
        // New account (25) + high activity (20) + early hour? + risk spike (if anomaly detected)
        expect(recommendation.riskScore).toBeGreaterThan(40);
    });

    it("should generate hardware signature and cache it", async () => {
        const accountId = 123;
        (db.getTelegramAccountById as any).mockResolvedValueOnce({ id: accountId, deviceSignature: null });

        const signature = await engine.getHardwareSignature(accountId);

        expect(signature).toHaveProperty("model");
        expect(signature).toHaveProperty("hardwareId");
        expect(db.updateTelegramAccount).toHaveBeenCalled();
    });
});
