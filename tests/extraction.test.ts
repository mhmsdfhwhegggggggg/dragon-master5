import { describe, expect, it, vi, beforeEach } from "vitest";
import { quantumExtractor } from "../server/services/quantum-extractor";
import { TelegramClient, Api } from "telegram";
import { antiBanEngineV5 } from "../server/services/anti-ban-engine-v5";

// Use vi.hoisted to define mock classes before they are used in vi.mock
const { MockParticipants, MockMessages } = vi.hoisted(() => {
    return {
        MockParticipants: class {
            users = [
                { id: BigInt(1), username: "user1", firstName: "First", premium: true, status: { className: "UserStatusOffline", wasOnline: Date.now() / 1000 - 3600 } },
                { id: BigInt(2), username: "user2", firstName: "Second", premium: false, status: { className: "UserStatusOnline" } }
            ];
        },
        MockMessages: class {
            users = [{ id: BigInt(3), username: "user3", firstName: "Third", premium: false }];
            messages = [{ id: 100 }];
        }
    };
});

// Mock dependencies
vi.mock("telegram", () => {
    return {
        TelegramClient: vi.fn().mockImplementation(() => ({
            invoke: vi.fn(),
            getEntity: vi.fn().mockResolvedValue({ id: "groupid" }),
            getInputEntity: vi.fn(),
        })),
        Api: {
            channels: {
                GetParticipants: vi.fn(),
                ChannelParticipants: MockParticipants,
            },
            messages: {
                GetHistory: vi.fn(),
                ChannelMessages: MockMessages,
            },
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

vi.mock("../server/_core/cache-system", () => ({
    CacheSystem: {
        getInstance: vi.fn().mockReturnValue({
            get: vi.fn(),
            set: vi.fn(),
        })
    }
}));

describe("Extraction Logic (QuantumExtractor)", () => {
    const accountId = 1;
    const sourceId = "testgroup";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should extract members using standard strategy", async () => {
        const client = new TelegramClient(null as any, 0, "", {});
        const mockResult = new MockParticipants();
        (client.invoke as any).mockResolvedValueOnce(mockResult);

        const count = await quantumExtractor.extract(client as any, accountId, sourceId, { limit: 10 });

        expect(count).toBeGreaterThan(0);
        expect(client.invoke).toHaveBeenCalled();
    });

    it("should switch to god-mode strategy if standard yield is low", async () => {
        const client = new TelegramClient(null as any, 0, "", {});
        const godResult = new MockMessages();

        (client.invoke as any)
            .mockResolvedValueOnce({ users: [] }) // Fail standard instanceof
            .mockResolvedValueOnce(godResult)     // 1st god call: 1 user
            .mockResolvedValueOnce({ users: [], messages: [] }); // 2nd god call: terminate

        const count = await quantumExtractor.extract(client as any, accountId, sourceId, { limit: 101 });

        expect(client.invoke).toHaveBeenCalledTimes(3); // 1 standard + 2 god
    });

    it("should stop if anti-ban blocks the operation", async () => {
        const client = new TelegramClient(null as any, 0, "", {});
        (antiBanEngineV5.analyzeOperation as any).mockResolvedValueOnce({ action: "stop_operation", reason: "high risk" });

        await expect(quantumExtractor.extract(client as any, accountId, sourceId)).rejects.toThrow("Quantum extraction blocked: high risk");
    });
});
