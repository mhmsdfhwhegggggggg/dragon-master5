import { describe, expect, it, vi, beforeEach } from "vitest";
import { telegramClientService } from "../server/services/telegram-client.service";
import { productionAdder } from "../server/services/production-adder";
import { TelegramClient, Api } from "telegram";
import { antiBanDistributed } from "../server/services/anti-ban-distributed";

// Mock dependencies
vi.mock("telegram", () => {
    const mockClient = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        invoke: vi.fn().mockImplementation((args) => Promise.resolve(args)), // Return args for easy checking
        sendMessage: vi.fn(),
    };

    return {
        TelegramClient: vi.fn().mockImplementation(() => mockClient),
        Api: {
            channels: {
                JoinChannel: vi.fn().mockImplementation((args) => args),
                InviteToChannel: vi.fn().mockImplementation((args) => args),
            },
            messages: {
                ImportChatInvite: vi.fn().mockImplementation((args) => args),
                ReadHistory: vi.fn(),
            },
        },
        connection: {
            ConnectionTCPObfuscated: vi.fn(),
        },
        default: {
            connection: {
                ConnectionTCPObfuscated: vi.fn(),
            }
        }
    };
});

vi.mock("telegram/sessions/index.js", () => ({
    StringSession: vi.fn(),
}));

vi.mock("../server/services/anti-ban-distributed", () => ({
    antiBanDistributed: {
        canPerformOperation: vi.fn().mockResolvedValue({ allowed: true }),
        recordOperationResult: vi.fn(),
    }
}));

vi.mock("../server/services/ghost-interaction.service", () => ({
    ghostInteractionService: {
        simulateScrolling: vi.fn(),
        simulateHumanPresence: vi.fn(),
    }
}));

vi.mock("../server/services/entity-resolver", () => ({
    entityResolver: {
        resolveEntity: vi.fn().mockImplementation((client, id) => Promise.resolve(id)),
    }
}));

vi.mock("../server/services/fingerprint-prevention", () => ({
    FingerprintPrevention: {
        getDeviceFingerprint: vi.fn().mockResolvedValue({}),
        getConnectionParams: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock("../server/services/proxy-manager", () => ({
    proxyManager: {
        getProxyForAccount: vi.fn().mockResolvedValue(null),
    },
}));

describe("Group Actions", () => {
    const accountId = 1;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Initialize client for each test
        await telegramClientService.initializeClient(accountId, "+123", "session");
    });

    it("should join a public channel by username", async () => {
        const result = await telegramClientService.joinGroup(accountId, "https://t.me/testgroup");
        expect(result).toBe(true);
        const client = telegramClientService.getClient(accountId);
        expect(client?.invoke).toHaveBeenCalledWith(expect.objectContaining({ channel: "testgroup" }));
    });

    it("should join a private group by invite hash", async () => {
        const result = await telegramClientService.joinGroup(accountId, "https://t.me/joinchat/ABCDEF");
        expect(result).toBe(true);
        const client = telegramClientService.getClient(accountId);
        expect(client?.invoke).toHaveBeenCalledWith(expect.objectContaining({ hash: "ABCDEF" }));
    });

    it("should add a user to a group", async () => {
        const result = await telegramClientService.addUserToGroup(accountId, "groupid", "userid");
        expect(result).toBe(true);
        const client = telegramClientService.getClient(accountId);
        expect(client?.invoke).toHaveBeenCalledWith(expect.objectContaining({ channel: "groupid", users: ["userid"] }));
    });

    it("should handle error when adding user", async () => {
        const client = telegramClientService.getClient(accountId);
        (client?.invoke as any).mockRejectedValueOnce({ seconds: 300 });

        const result = await telegramClientService.addUserToGroup(accountId, "groupid", "userid");
        expect(result).toBe(false);
        expect(antiBanDistributed.recordOperationResult).toHaveBeenCalledWith(accountId, "add_user", false, "flood");
    });

    it("should execute single add via production adder", async () => {
        const client = telegramClientService.getClient(accountId) as any;
        const result = await productionAdder.executeSingleAdd(client, accountId, "chatid", "userid");

        expect(result.success).toBe(true);
        expect(client.invoke).toHaveBeenCalledWith(expect.objectContaining({ channel: "chatid", users: ["userid"] }));
        expect(antiBanDistributed.recordOperationResult).toHaveBeenCalledWith(accountId, "add_user", true);
    });
});
