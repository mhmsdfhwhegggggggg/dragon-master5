import { describe, expect, it, vi, beforeEach } from "vitest";
import { bulkOpsRouter } from "../server/routers/bulk-ops.router";
import * as db from "../server/db";
import { telegramClientService } from "../server/services/telegram-client.service";
import { JobQueue } from "../server/_core/queue";
import type { TrpcContext } from "../server/_core/context";

// Mock dependencies
vi.mock("../server/db", () => ({
    getTelegramAccountById: vi.fn(),
    createBulkOperation: vi.fn(),
    updateBulkOperation: vi.fn(),
    updateTelegramAccount: vi.fn(),
    createActivityLog: vi.fn(),
    getBulkOperationsByUserId: vi.fn(),
}));

vi.mock("../server/services/telegram-client.service", () => ({
    telegramClientService: {
        getApiCredentials: vi.fn().mockReturnValue({ apiId: 123, apiHash: "hash" }),
        initializeClient: vi.fn().mockResolvedValue({}),
        sendBulkMessages: vi.fn().mockResolvedValue({ success: 10, failed: 0 }),
        joinGroup: vi.fn().mockResolvedValue(true),
        addUserToGroup: vi.fn().mockResolvedValue(true),
        disconnectClient: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock("../server/_core/queue", () => ({
    JobQueue: {
        enqueue: vi.fn().mockResolvedValue({ id: "job_123" }),
        getJob: vi.fn(),
    },
    listJobs: vi.fn(),
    cancelJob: vi.fn(),
}));

function createMockContext(): TrpcContext {
    return {
        user: {
            id: 1,
            email: "test@example.com",
            role: "admin",
        },
        req: {} as any,
        res: {} as any,
    } as TrpcContext;
}

describe("Bulk Operations Router", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should start send bulk messages (queued)", async () => {
        const ctx = createMockContext();
        const caller = bulkOpsRouter.createCaller(ctx);

        (db.getTelegramAccountById as any).mockResolvedValueOnce({ id: 1, userId: 1 });

        const result = await caller.startSendBulkMessages({
            accountId: 1,
            userIds: ["123", "456"],
            messageTemplate: "Hello",
        });

        expect(result.queued).toBe(true);
        expect(JobQueue.enqueue).toHaveBeenCalledWith("send-bulk-messages", expect.any(Object));
    });

    it("should extract and add members (queued)", async () => {
        const ctx = createMockContext();
        const caller = bulkOpsRouter.createCaller(ctx);

        (db.getTelegramAccountById as any).mockResolvedValueOnce({ id: 1, userId: 1 });

        const result = await caller.startExtractAndAdd({
            accountId: 1,
            source: "source_group",
            target: "target_group",
            limit: 100,
        });

        expect(result.queued).toBe(true);
        expect(JobQueue.enqueue).toHaveBeenCalledWith("extract-and-add", expect.any(Object));
    });

    it("should get job status", async () => {
        const ctx = createMockContext();
        const caller = bulkOpsRouter.createCaller(ctx);

        const mockJob = {
            id: "job_123",
            status: "completed",
            progress: 100,
            result: { success: true },
            createdAt: new Date(),
        };
        (JobQueue.getJob as any).mockResolvedValueOnce(mockJob);

        const result = await caller.getJobStatus({ jobId: "job_123" });

        expect(result.found).toBe(true);
        expect((result as any).status).toBe("completed");
    });

    it("should throw error if account not found or unauthorized", async () => {
        const ctx = createMockContext();
        const caller = bulkOpsRouter.createCaller(ctx);

        (db.getTelegramAccountById as any).mockResolvedValueOnce(null);

        await expect(caller.startJoinGroups({
            accountId: 999,
            groupLinks: ["t.me/test"],
        })).rejects.toThrow("Account not found or unauthorized");
    });
});
