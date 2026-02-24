/**
 * BehaviorShield v1.0.0 - Enterprise Anti-Ban Protection
 * 
 * Replaces simple heuristic-based anti-ban with advanced behavioral simulation.
 * 
 * Key Features:
 * - Human Fingerprinting: Variable typing speeds, "thinking" pauses.
 * - Dynamic Cooling: Cools down accounts based on Telegram feedback signals (FLOOD_WAIT).
 * - Random Interaction: Periodic non-operational interactions (checking bio, scrolling) to look natural.
 * - Risk Heatmaps: Tracks risk per account/target to optimize operations.
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { logger } from '../_core/logger';
import { CacheSystem } from '../_core/cache-system';

export interface BehaviorPattern {
    typingSpeed: number; // chars per minute
    thinkingTime: [number, number]; // [min, max] ms
    burstSize: [number, number]; // [min, max] messages before a long pause
}

export class BehaviorShield {
    private static instance: BehaviorShield;
    private logger = logger;
    private cache = CacheSystem.getInstance();

    private constructor() { }

    static getInstance(): BehaviorShield {
        if (!this.instance) {
            this.instance = new BehaviorShield();
        }
        return this.instance;
    }

    /**
     * Simulates "Thinking" and "Typing" for a human-like message send
     */
    async humanizeMessage(client: TelegramClient, chatId: string, text: string) {
        this.logger.info(`[BehaviorShield] Humanizing message to: ${chatId}`);

        // 1. Initial Thinking Pause (2-5s)
        const thinkingTime = 2000 + Math.random() * 3000;
        await this.sleep(thinkingTime);

        // 2. Start Typing Action
        try {
            await client.invoke(new Api.messages.SetTyping({
                peer: chatId,
                action: new Api.SendMessageTypingAction()
            }));
        } catch (e) {
            // Non-critical if fails
        }

        // 3. Typing Duration based on text length
        // Average human: 40-60 wpm ≈ 250 cpm ≈ 4 chars/sec
        const charsPerSec = 3 + Math.random() * 3;
        const typingDuration = (text.length / charsPerSec) * 1000;

        // Simulating bursts of typing
        let remainingDuration = Math.min(typingDuration, 8000); // Cap at 8s
        while (remainingDuration > 0) {
            const burst = Math.min(1500, remainingDuration);
            await this.sleep(burst);
            remainingDuration -= burst;

            // Random micro-pause
            if (Math.random() > 0.7) await this.sleep(500 + Math.random() * 1000);
        }

        return true;
    }

    /**
     * Dynamic Cooling System
     * Records a "hit" (like a flood error) and cools down the account.
     */
    async recordCooldown(accountId: number, signal: 'flood' | 'restricted' | 'ban_potential') {
        const cooldownTime = signal === 'flood' ? 3600 : (signal === 'restricted' ? 86400 : 300);
        this.logger.warn(`[BehaviorShield] Cooling down account ${accountId} for ${cooldownTime}s due to ${signal}`);

        await this.cache.set(`shield:cooldown:${accountId}`, {
            reason: signal,
            expiry: Date.now() + (cooldownTime * 1000)
        }, { ttl: cooldownTime });
    }

    /**
     * Checks if an account is safe to operate
     */
    async isAccountSafe(accountId: number): Promise<{ safe: boolean; reason?: string }> {
        const cooldown = await this.cache.get<{ reason: string; expiry: number }>(`shield:cooldown:${accountId}`);

        if (cooldown) {
            const remaining = Math.round((cooldown.expiry - Date.now()) / 1000);
            return {
                safe: false,
                reason: `Account cooling down (${cooldown.reason}). ${remaining}s remaining.`
            };
        }

        return { safe: true };
    }

    /**
     * Random Natural Interaction
     * Performs a non-suspicious action like fetching a user's status or scrolling history.
     */
    async performNaturalInteraction(client: TelegramClient, peer: string) {
        const roll = Math.random();

        try {
            if (roll < 0.4) {
                // Peek at entity
                await client.getEntity(peer);
            } else if (roll < 0.7) {
                // Check history (scroll up slightly)
                await client.getMessages(peer, { limit: 5 });
            } else {
                // Fetch full user/channel info
                await client.invoke(new Api.channels.GetFullChannel({ channel: peer }));
            }
            this.logger.info(`[BehaviorShield] Performed natural interaction for peer: ${peer}`);
        } catch (e) {
            // Silent fail
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const behaviorShield = BehaviorShield.getInstance();
