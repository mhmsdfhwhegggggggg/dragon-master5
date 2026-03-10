import { describe, expect, it, vi, beforeEach } from "vitest";
import { telegramClientService } from "../server/services/telegram-client.service";
import { TelegramClient } from "telegram";
import * as db from "../server/db";
import { FingerprintPrevention } from "../server/services/fingerprint-prevention";
import { proxyManager } from "../server/services/proxy-manager";

// Mock dependencies
vi.mock("telegram", () => {
    const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        getMe: vi.fn().mockResolvedValue({ id: 12345, username: "testuser" }),
        addEventHandler: vi.fn(),
        invoke: vi.fn(),
        sendMessage: vi.fn(),
    };

    return {
        TelegramClient: vi.fn().mockImplementation(() => mockClient),
        Api: {
            channels: {
                GetParticipants: vi.fn(),
                JoinChannel: vi.fn(),
                InviteToChannel: vi.fn(),
                DeleteMessages: vi.fn(),
                GetParticipant: vi.fn(),
            },
            messages: {
                ImportChatInvite: vi.fn(),
                ReadHistory: vi.fn(),
                SetTyping: vi.fn(),
                SendReaction: vi.fn(),
                DeleteMessages: vi.fn(),
            },
            ChannelParticipantsRecent: vi.fn(),
            ChannelParticipantsAdmins: vi.fn(),
            ReactionEmoji: vi.fn(),
            SendMessageTypingAction: vi.fn(),
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

vi.mock("../server/db", () => ({
    getTelegramAccountById: vi.fn(),
    updateTelegramAccount: vi.fn(),
    getDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("../server/services/fingerprint-prevention", () => ({
    FingerprintPrevention: {
        getDeviceFingerprint: vi.fn().mockResolvedValue({
            deviceModel: "iPhone_14_Pro",
            systemVersion: "17.2",
            appVersion: "10.2.1",
            langCode: "en",
            systemLangCode: "en",
        }),
        getConnectionParams: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock("../server/services/proxy-manager", () => ({
    proxyManager: {
        getProxyForAccount: vi.fn().mockResolvedValue(null),
    },
}));

vi.mock("../server/services/anti-ban-distributed", () => ({
    antiBanDistributed: {
        recordOperationResult: vi.fn(),
    }
}));

describe("Account Management Service", () => {
    const accountId = 1;
    const phone = "+1234567890";
    const sessionStr = "fake-session-string";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should initialize client correctly", async () => {
        const client = await telegramClientService.initializeClient(accountId, phone, sessionStr);

        expect(client).toBeDefined();
        expect(TelegramClient).toHaveBeenCalled();
        expect(client.connect).toHaveBeenCalled();
    });

    it("should retrieve existing client", async () => {
        await telegramClientService.initializeClient(accountId, phone, sessionStr);
        const client = telegramClientService.getClient(accountId);
        expect(client).toBeDefined();
    });

    it("should get current user info (Me)", async () => {
        await telegramClientService.initializeClient(accountId, phone, sessionStr);
        const me = await telegramClientService.getMe(accountId);

        expect(me).toBeDefined();
        expect(me?.username).toBe("testuser");
    });

    it("should disconnect client successfully", async () => {
        await telegramClientService.initializeClient(accountId, phone, sessionStr);
        await telegramClientService.disconnectClient(accountId);

        expect(telegramClientService.getClient(accountId)).toBeUndefined();
    });
});
