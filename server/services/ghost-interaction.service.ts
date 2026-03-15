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

            // 3. Deep Reading Simulation (Slow, methodical viewing)
            try {
                // Fetch recent messages to simulate looking at chat history
                const messages = await client.getMessages(peer, { limit: 10 });
                for (const msg of messages) {
                    if (msg.message && typeof msg.message === 'string') {
                        // Simulate reading based on message length (roughly 200 WPM)
                        const readTime = Math.max(1000, contextLengthFactor(msg.message) * 300);
                        await new Promise(r => setTimeout(r, readTime));
                    }
                }
            } catch (e) {
                logger.debug(`[GhostService] Deep reading jitter skip: ${e}`);
            }

            // 4. Random small delay (Human thinking)
            const thinkingTime = 4000 + Math.random() * 8000; // Increased to 4-12 seconds
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
            await new Promise(r => setTimeout(r, 4000 + Math.random() * 6000)); // Increased scroll pause 4-10s
        } catch (e: any) {
            logger.debug(`[GhostService] Scrolling simulation jitter: ${e.message}`);
        }
    }
}

function contextLengthFactor(text: string): number {
    return Math.ceil((text.split(' ').length || 1) / 5); // Rough proxy for 5 words = 1 factor
}

export const ghostInteractionService = GhostInteractionService.getInstance();
