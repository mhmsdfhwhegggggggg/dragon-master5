/**
 * Growth Simulator v1.0.0 - Shadow Growth Masking
 * 
 * Automatically generates "natural" activity to hide batch additions:
 * - View Generator: Mimics organic traffic on recent posts.
 * - Reaction Simulator: Drops random emojis on posts to boost trust.
 * - Pulse Scrolling: Simulates multiple users scrolling through history.
 */

import { logger } from '../_core/logger';
import { telegramClientService } from './telegram-client.service';
import { Api } from 'telegram';

export class GrowthSimulator {
    private static instance: GrowthSimulator;
    private logger = logger;

    private constructor() { }

    static getInstance(): GrowthSimulator {
        if (!this.instance) {
            this.instance = new GrowthSimulator();
        }
        return this.instance;
    }

    /**
     * Synchronizes masking activity with a channel addition task
     */
    async syncMasking(accountId: number, channelId: string) {
        this.logger.info(`[GrowthSim] Starting shadow growth masking for: ${channelId}`);

        try {
            const client = telegramClientService.getClient(accountId);
            if (!client) return;

            // 1. Fetch last 5 messages
            const messages = await client.getMessages(channelId, { limit: 5 });
            if (!messages || messages.length === 0) return;

            for (const msg of messages) {
                // A. Simulate View (Just getting the message entity counts as a view in some contexts)
                // In GramJS, using GetMessagesViews or simply interacting with the message helps.
                try {
                    await client.invoke(new Api.messages.GetMessagesViews({
                        peer: channelId,
                        id: [msg.id],
                        increment: true
                    }));
                } catch (e) { /* Non-critical */ }

                // B. Random Reaction (30% chance)
                if (Math.random() < 0.3) {
                    await this.dropReaction(client, channelId, msg.id);
                }

                // C. Pulse Random Delay
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            }

            this.logger.info(`[GrowthSim] Masking cycle completed for: ${channelId}`);

        } catch (error: any) {
            this.logger.error(`[GrowthSim] Masking failed: ${error.message}`);
        }
    }

    private async dropReaction(client: any, channelId: string, msgId: number) {
        const reactions = ['👍', '🔥', '❤️', '👏', '🤩', '⚡'];
        const emoji = reactions[Math.floor(Math.random() * reactions.length)];

        try {
            await client.invoke(new Api.messages.SendReaction({
                peer: channelId,
                msgId: msgId,
                reaction: [new Api.ReactionEmoji({ emoticon: emoji })]
            }));
        } catch (e) { /* Fail silently */ }
    }
}

export const growthSimulator = GrowthSimulator.getInstance();
