import type { TelegramClient } from "telegram";
import pkg from "telegram";
const { Api } = pkg;
import { logger } from "../_core/logger";

/**
 * Ghost Interaction Service V10.0
 * Simulates human-like interactions (Ghosting) before performing operations.
 */
export class GhostInteractionService {
    private static instance: GhostInteractionService;

    private constructor() { }

    static getInstance(): GhostInteractionService {
        if (!GhostInteractionService.instance) {
            GhostInteractionService.instance = new GhostInteractionService();
        }
        return GhostInteractionService.instance;
    }

    /**
     * Perform ghost actions before a primary operation
     * @param client GramJS Client
     * @param peer The target chat/user
     */
    async simulateHumanPresence(client: TelegramClient, peer: any) {
        try {
            // 1. Set Typing status (Simulate intention)
            await client.invoke(new Api.messages.SetTyping({
                peer,
                action: new Api.SendMessageTypingAction()
            }));

            // 2. Read History (Avoid "Unread" message flood)
            await client.invoke(new Api.messages.ReadHistory({
                peer,
                maxId: 0
            }));

            // 3. Random small delay (Human thinking)
            const thinkingTime = 1500 + Math.random() * 2500;
            await new Promise(r => setTimeout(r, thinkingTime));

            logger.info(`[GhostService] Presence simulated for peer`);
        } catch (error) {
            // Silently fail as these are non-critical "masking" actions
            logger.warn(`[GhostService] Ghosting failed: ${error}`);
        }
    }

    /**
     * Simulate scrolling behavior in a chat
     */
    async simulateScrolling(client: TelegramClient, peer: any) {
        try {
            await client.getMessages(peer, { limit: 5 });
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
        } catch (e) { }
    }
}

export const ghostInteractionService = GhostInteractionService.getInstance();
