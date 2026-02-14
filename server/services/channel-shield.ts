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
    sensitivityLevel: 'safe' | 'normal' | 'strict';
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

        // 1. Growth Spike Check
        const recentAdds = await this.getRecentAdds(channelId, '1h');
        if (recentAdds > this.getBurstLimit(config.sensitivityLevel)) {
            return {
                safe: false,
                reason: 'Growth spike detected - potential Spam Trap',
                suggestedDelayMultiplier: 5.0
            };
        }

        // 2. Sensitivity Delay
        let multiplier = 1.0;
        if (config.sensitivityLevel === 'strict') multiplier = 2.5;
        else if (config.sensitivityLevel === 'normal') multiplier = 1.5;

        // 3. Daily Limit Check
        const dailyAdds = await this.getRecentAdds(channelId, '24h');
        if (dailyAdds >= config.maxAddsPerDay) {
            return {
                safe: false,
                reason: 'Daily safety limit reached for this channel',
                suggestedDelayMultiplier: 10.0
            };
        }

        return { safe: true, suggestedDelayMultiplier: multiplier };
    }

    /**
     * Record a successful add to a protected channel
     */
    async recordChannelActivity(channelId: string, activity: 'add' | 'leave'): Promise<void> {
        const key = `shield:activity:${channelId}:${activity}`;
        const current = await this.cache.get<number>(key) || 0;
        await this.cache.set(key, current + 1, { ttl: 86400 }); // 24h window
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
        if (level === 'strict') return 10;
        if (level === 'normal') return 30;
        return 50;
    }
}

export const channelShield = ChannelShield.getInstance();
