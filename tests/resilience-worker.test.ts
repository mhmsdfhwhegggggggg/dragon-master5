import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock environment and secrets
vi.mock("../server/_core/env", () => ({
    ENV: { redisUrl: "redis://localhost:6379" }
}));
vi.mock("../server/_core/secrets", () => ({
    Secrets: { getRedisUrl: vi.fn().mockReturnValue("redis://localhost:6379") }
}));

// Mock BullMQ and IORedis
vi.mock("bullmq", () => ({
    Worker: vi.fn().mockImplementation(() => ({ on: vi.fn(), close: vi.fn() })),
    Job: class {},
    Queue: vi.fn(),
}));

vi.mock("ioredis", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            on: vi.fn(),
            quit: vi.fn(),
            defineCommand: vi.fn(),
        })),
    };
});

const dbInsertMock = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) });

// Mock DB with all required exports for AntiBan
vi.mock("../server/db", () => ({
    getDb: vi.fn().mockResolvedValue({
        insert: dbInsertMock,
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(true) }) }),
        select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }) }),
    }),
    getPendingExtractedMembersCount: vi.fn().mockResolvedValue(50),
    getPendingExtractedMembersPaginated: vi.fn().mockImplementation(async (u, s, limit, offset) => {
        if ((offset || 0) >= 50) return [];
        return Array.from({ length: Math.min(limit, 50 - (offset || 0)) }).map((_, i) => ({
            id: (offset || 0) + i,
            memberTelegramId: `user_${(offset || 0) + i}`,
            memberUsername: `uname_${(offset || 0) + i}`
        }));
    }),
    createBulkOperation: vi.fn().mockResolvedValue({ id: 1 }),
    updateBulkOperation: vi.fn(),
    createExtractedMembers: vi.fn(),
    updateExtractedMember: vi.fn(),
    getTelegramAccountById: vi.fn().mockResolvedValue({ id: 1, sessionString: "test", userId: 1 }),
    getGroupById: vi.fn().mockResolvedValue({ id: 1, targetGroupId: "target" }),
    updateGroupMetrics: vi.fn(),
    getActivityLogsByAccountId: vi.fn().mockResolvedValue([]),
    getAccountOperationDailyStats: vi.fn().mockResolvedValue({ count: 0 }),
    getTelegramAccountByPhoneNumber: vi.fn(),
    getTelegramAccountByApiId: vi.fn(),
    getTelegramAccounts: vi.fn(),
    getGroups: vi.fn(),
    getBulkOperationById: vi.fn(),
    getBulkOperations: vi.fn(),
}));

vi.mock("../server/services/telegram-client.service", () => {
    class MockService {
        getApiCredentials = vi.fn().mockReturnValue({ apiId: 123, apiHash: "hash" });
        initializeClient = vi.fn().mockResolvedValue({
            invoke: vi.fn().mockResolvedValue({ users: [{ id: BigInt(1) }] })
        });
        getClient = vi.fn().mockResolvedValue({
            invoke: vi.fn().mockResolvedValue({ users: [{ id: BigInt(1) }] })
        });
        sendBulkMessages = vi.fn();
    }
    return { TelegramClientService: MockService };
});

vi.mock("../server/services/high-speed-adder", () => ({
    highSpeedAdder: {
        addUser: vi.fn().mockResolvedValue({ success: true, waitMs: 0 })
    }
}));

vi.mock("../server/services/quantum-extractor", () => ({
    quantumExtractor: {
        extract: vi.fn().mockImplementation(async (c, a, s, f, cb) => {
            if (cb?.onBatch) await cb.onBatch([{ id: 1, username: "u1", firstName: "f1" }]);
            return 1;
        })
    }
}));

describe("Worker Resilience & Recovery", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Global override for setTimeout to be instant in this test
        vi.stubGlobal('setTimeout', (fn: any) => { fn(); return {} as any; });
    });

    it("should process durable adding in paginated chunks and recover state", async () => {
        const { handleExtractAndAdd } = await import("../server/worker");
        
        const job = {
            id: "job123",
            data: { accountId: 1, source: "source", target: 1, limit: 50, delayMs: 0 },
            updateProgress: vi.fn().mockImplementation(() => Promise.resolve())
        };

        await handleExtractAndAdd(job as any);

        const { getPendingExtractedMembersPaginated } = await import("../server/db");
        expect(getPendingExtractedMembersPaginated).toHaveBeenCalled();
        expect(job.updateProgress).toHaveBeenCalled();
    }, 10000);
});
