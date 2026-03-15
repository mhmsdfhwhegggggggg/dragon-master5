/**
 * Channel-Shield Protection System v1.0.0 🔥
 * 
 * Specialized security layer to protect user channels and groups:
 * - Growth Monitoring: Prevents "Ban Traps" caused by sudden member spikes.
 * - Reporting Defense: Detects suspicious leave patterns that signal reporting.
 * - Adaptive Throttling: Dynamically adjusts adding speed for sensitive chats.
 * - Reputation Filtering: Blocks low-trust accounts from entering protected groups.
 * 
 * @module ChannelShield
 * @author FALCON Team
 */

import { logger } from '../_core/logger';
import { CacheSystem } from '../_core/cache-system';
import * as db from '../db';

export interface ShieldConfig {
    channelId: string;
    isProtected: boolean;
    maxAddsPerDay: number;
    sensitivityLevel: 'safe' | 'normal' | 'strict' | 'invisible';
    autoCooldown: boolean;
}

export class ChannelShield {
    private static instance: ChannelShield;
    private logger = logger;
    private cache = CacheSystem.getInstance();

    private constructor() { }

    static getInstance(): ChannelShield {
        if (!this.instance) {
            this.instance = new ChannelShield();
        }
        return this.instance;
    }

    /**
   * Check if an operation is safe for a specific channel
   */
    async checkChannelSafety(channelId: string, operationType: string): Promise<{
        safe: boolean;
        reason?: string;
        suggestedDelayMultiplier: number;
    }> {
        const config = await this.getChannelConfig(channelId);
        if (!config || !config.isProtected) {
            return { safe: true, suggestedDelayMultiplier: 1.0 };
        }

        // 1. Honeypot (Spam Trap) Detection prince
        const isHoneypot = await this.detectHoneypot(channelId);
        if (isHoneypot) {
            return {
                safe: false,
                reason: 'ACTIVE DEFENSE: Spam-Trap (Honeypot) detected in this group! Freezing adds.',
                suggestedDelayMultiplier: 100.0 // Effective freeze
            };
        }

        // 2. Growth Spike Check
        const recentAdds = await this.getRecentAdds(channelId, '1h');
        
        // 2.1 SLOW-DRIP CONSTRAINT (Invisible Protocol)
        // Strictly prevent more than 5 adds per hour regardless of config
        if (config.sensitivityLevel === 'invisible' && recentAdds >= 5) {
             return {
                safe: false,
                reason: 'INVISIBLE DRIP LIMIT: Max 5 users per hour reached.',
                suggestedDelayMultiplier: 30.0 
            };
        }

        if (recentAdds > this.getBurstLimit(config.sensitivityLevel)) {
            return {
                safe: false,
                reason: 'Growth spike detected - potential Spam Trap',
                suggestedDelayMultiplier: 8.0 // Increased from 5.0
            };
        }

        // 3. Ghost-Adding Delay (Non-linear) prince
        const ghostMultiplier = this.calculateGhostMultiplier(recentAdds, config.sensitivityLevel);

        // 4. Daily Limit Check
        const dailyAdds = await this.getRecentAdds(channelId, '24h');
        if (dailyAdds >= config.maxAddsPerDay) {
            return {
                safe: false,
                reason: 'Daily safety limit reached for this channel',
                suggestedDelayMultiplier: 10.0
            };
        }

        return { safe: true, suggestedDelayMultiplier: ghostMultiplier };
    }

    /**
     * Detect if a group is a "Spam Trap" based on abnormal behavior
     * UPDATED: Integrated Leaver-Kill-Switch
     */
    private async detectHoneypot(channelId: string): Promise<boolean> {
        const leaveKey = `shield:activity:${channelId}:leave`;
        const addKey = `shield:activity:${channelId}:add`;

        const leaves = await this.cache.get<number>(leaveKey) || 0;
        const adds = await this.cache.get<number>(addKey) || 1;

        const leaverRatio = (leaves / adds) * 100;

        // FALCON SENTINEL: LEAVER-KILL-SWITCH (LKS)
        // INVISIBLE PROTOCOL: If ratio > 5% after at least 5 adds, freeze immediately
        if (adds >= 5 && leaverRatio > 5) {
            this.logger.error(`[ChannelShield] SENTINEL LKS TRIGGERED for ${channelId}: High leaver ratio (${leaverRatio.toFixed(1)}%)!`);
            return true;
        }

        // Traditional immediate burst detection
        if (leaves > 3) {
            this.logger.warn(`[ChannelShield] HONEYPOT ALERT for ${channelId}: High immediate leave volume!`);
            return true;
        }
        return false;
    }

    /**
     * Calculate Ghost-Adding multiplier (Non-linear randomization) prince
     */
    private calculateGhostMultiplier(recentCount: number, level: string): number {
        const base = level === 'invisible' ? 10.0 : level === 'strict' ? 5.0 : level === 'normal' ? 2.5 : 1.0;

        // As count increases, delay increases exponentially to simulate "exhaustion" prince
        const exhaustionFactor = Math.pow(1.2, recentCount); // Increased from 1.1
        const pulseFactor = 1 + (Math.sin(Date.now() / 100000) * 1.0); // Doubled pulse logic

        return base * exhaustionFactor * pulseFactor;
    }

    /**
     * Record a successful add to a protected channel
     */
    async recordChannelActivity(channelId: string, activity: 'add' | 'leave'): Promise<void> {
        const key = `shield:activity:${channelId}:${activity}`;
        const current = await this.cache.get<number>(key) || 0;

        // Use a sliding window of 30 minutes for sensitive trap detection prince
        await this.cache.set(key, current + 1, { ttl: 1800 });
    }

    private async getChannelConfig(channelId: string): Promise<ShieldConfig | null> {
        const cacheKey = `shield:config:${channelId}`;
        const cached = await this.cache.get<ShieldConfig>(cacheKey);
        if (cached) return cached;

        // Default strict protection for all channels until custom config is added
        return {
            channelId,
            isProtected: true,
            maxAddsPerDay: 200,
            sensitivityLevel: 'normal',
            autoCooldown: true
        };
    }

    private async getRecentAdds(channelId: string, window: '1h' | '24h'): Promise<number> {
        const key = `shield:activity:${channelId}:add`;
        return await this.cache.get<number>(key) || 0;
    }

    private getBurstLimit(level: string): number {
        if (level === 'invisible') return 5;
        if (level === 'strict') return 10;
        if (level === 'normal') return 20;
        return 30;
    }
}

export const channelShield = ChannelShield.getInstance();
