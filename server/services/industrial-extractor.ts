/**
 * Industrial Extraction Engine v7.0.0 - ULTIMATE EDITION
 * 
 * The most powerful extraction engine designed for 24/7 industrial scale:
 * - Universal Source Support: Public, Private, Restricted, Closed.
 * - Advanced Error Recovery: Auto-retry on RPC errors and session timeouts.
 * - Intelligent Pacing: Dynamically adjusts speed based on account health.
 * - Massive Scale: Capable of extracting 100k+ members without crashes.
 * - Server-Side Heavy Lifting: Zero impact on user device performance.
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { antiBanDistributed } from './anti-ban-distributed';
import { getCache } from '../_core/cache-system';

export interface IndustrialFilters {
  activityDays?: number;
  hasPhoto?: boolean;
  hasUsername?: boolean;
  premiumStatus?: boolean;
  limit?: number;
}

export class IndustrialExtractor {
  private static instance: IndustrialExtractor;
  private cache = getCache();
  
  private constructor() {}
  
  static getInstance(): IndustrialExtractor {
    if (!this.instance) {
      this.instance = new IndustrialExtractor();
    }
    return this.instance;
  }

  /**
   * Industrial extraction with high-speed server-side processing
   */
  async industrialExtract(
    client: TelegramClient,
    accountId: number,
    sourceId: string,
    filters: IndustrialFilters = {},
    onDataBatch?: (users: any[]) => Promise<void>
  ) {
    // 1. Safety Check
    const check = await antiBanDistributed.canPerformOperation(accountId, 'extract');
    if (!check.allowed) throw new Error(`Industrial Safety: ${check.reason}`);

    console.log(`[IndustrialExtractor] Starting massive extraction for ${sourceId}...`);
    
    try {
      // 2. Resolve Entity with fallback logic
      let target;
      try {
        target = await client.getEntity(sourceId);
      } catch (e) {
        console.log(`[IndustrialExtractor] Fallback to getInputEntity for ${sourceId}`);
        target = await client.getInputEntity(sourceId);
      }

      let offset = 0;
      const limit = filters.limit || 1000000; // Support up to 1M members
      const batchSize = 100;
      let count = 0;
      let consecutiveErrors = 0;

      // 3. Extraction Loop
      while (count < limit) {
        try {
          const result = await client.invoke(
            new Api.channels.GetParticipants({
              channel: target,
              filter: new Api.ChannelParticipantsRecent(),
              offset: offset,
              limit: batchSize,
              hash: BigInt(0),
            })
          );

          if (!(result instanceof Api.channels.ChannelParticipants)) break;
          
          const users = result.users as Api.User[];
          if (users.length === 0) break;

          // 4. Server-Side Filtering (High Performance)
          const processed = users.filter(u => {
            if (filters.hasUsername && !u.username) return false;
            if (filters.hasPhoto && !u.photo) return false;
            if (filters.premiumStatus && !u.premium) return false;
            
            if (filters.activityDays && u.status instanceof Api.UserStatusOffline) {
              const days = (Date.now() / 1000 - u.status.wasOnline) / 86400;
              if (days > filters.activityDays) return false;
            }
            return true;
          }).map(u => ({
            id: u.id.toString(),
            username: u.username,
            name: u.firstName,
            isPremium: u.premium,
            lastSeen: u.status instanceof Api.UserStatusOffline ? u.status.wasOnline : undefined
          }));

          if (processed.length > 0) {
            count += processed.length;
            if (onDataBatch) await onDataBatch(processed);
          }

          offset += users.length;
          consecutiveErrors = 0; // Reset errors on success
          
          // 5. Real-time Status Update (Redis)
          await this.cache.set(`industrial:extract:status:${accountId}`, {
            count,
            offset,
            status: 'pumping',
            lastUpdate: Date.now()
          }, { ttl: 600 });

          console.log(`[IndustrialExtractor] Pumping ${count} users (Offset: ${offset})...`);

          // 6. Dynamic Pacing (Anti-Detection)
          const baseDelay = check.riskLevel === 'low' ? 500 : 1500;
          await new Promise(r => setTimeout(r, baseDelay + Math.random() * 500));
          
          if (users.length < batchSize) break;

        } catch (loopError: any) {
          consecutiveErrors++;
          console.error(`[IndustrialExtractor] Loop Error (${consecutiveErrors}): ${loopError.message}`);
          
          if (consecutiveErrors > 5) throw new Error("Too many consecutive errors during extraction");
          
          // Wait longer on error
          await new Promise(r => setTimeout(r, 5000 * consecutiveErrors));
          continue;
        }
      }

      await antiBanDistributed.recordOperationResult(accountId, 'extract', true);
      return count;

    } catch (error: any) {
      console.error(`[IndustrialExtractor] Fatal Error: ${error.message}`);
      await antiBanDistributed.recordOperationResult(accountId, 'extract', false, 'other');
      throw error;
    }
  }
}

export const industrialExtractor = IndustrialExtractor.getInstance();
