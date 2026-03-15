import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
const invokeMock = vi.fn();

// Mock BullMQ and IORedis to prevent top-level exit in worker.ts
vi.mock("bullmq", () => ({
    Worker: vi.fn(),
    Queue: vi.fn(),
}));
vi.mock("ioredis", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            on: vi.fn(),
            quit: vi.fn(),
        })),
    };
});

vi.mock("telegram", () => {
    class MockParticipants {
        users: any[] = [];
    }
    return {
        TelegramClient: vi.fn().mockImplementation(() => ({
            invoke: invokeMock,
            getEntity: vi.fn().mockResolvedValue({ id: "groupid" }),
            getInputEntity: vi.fn(),
        })),
        Api: {
            channels: { GetParticipants: vi.fn(), ChannelParticipants: MockParticipants },
            messages: { GetHistory: vi.fn(), ChannelMessages: class { users = []; messages = []; } },
            ChannelParticipantsRecent: vi.fn(),
            UserStatusOffline: vi.fn(),
        },
    };
});

vi.mock("../server/services/anti-ban-engine-v5", () => ({
    antiBanEngineV5: {
        analyzeOperation: vi.fn().mockResolvedValue({ action: "proceed" }),
    }
}));

describe("Bulk Operations Stress Test", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle paginated extraction of 10,000+ members efficiently without memory exhaustion", async () => {
        // Simulate a huge group by forcing the mock to return chunks
        const { quantumExtractor } = await import("../server/services/quantum-extractor");
        const client = new (await import("telegram")).TelegramClient(null as any, 0, "", {});
        const { Api } = await import("telegram");

        // Mock to return 200 members 50 times (total 10000)
        let callCount = 0;
        invokeMock.mockImplementation(() => {
            callCount++;
            if (callCount <= 50) {
                const result = new Api.channels.ChannelParticipants({} as any) as any;
                result.users = Array.from({ length: 200 }).map((_, i) => ({
                    id: BigInt(callCount * 1000 + i),
                    username: `user_${callCount}_${i}`,
                    firstName: "Test",
                    premium: false
                }));
                return result;
            }
            const empty = new Api.channels.ChannelParticipants({} as any) as any;
            empty.users = [];
            return empty;
        });

        // We run the extraction
        const count = await quantumExtractor.extract(client as any, 1, "huge_group", { limit: 12000 });
        
        expect(count).toBeGreaterThanOrEqual(10000);
        expect(invokeMock).toHaveBeenCalledTimes(51); // 50 chunks + 1 empty
    }, 60000); // 60s timeout for stress test
});
