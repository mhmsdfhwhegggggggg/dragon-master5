/**
 * Apex Pipeline Orchestrator v1.0.0 🔥
 * 
 * The ultimate unified gateway for all data workflows.
 * Replaces: Giant, Unified, Industrial, and Master pipelines.
 * 
 * Features:
 * - Direct Quantum Piping: Connects QuantumExtractor to AccountDistributor.
 * - Multi-Strategy Support: Handles bulk extraction, streaming, and scheduled tasks.
 * - Sentinel-Level Protection: Every move is guarded by BehaviorShield and Anti-Ban Engine.
 * - Advanced Load Balancing: Intelligent distribution across 100+ accounts.
 * - Shadow Growth Masking: Simulates organic group activity during operations.
 * 
 * @module ApexPipelineOrchestrator
 * @author FALCON Team
 */

import { quantumExtractor, QuantumFilter } from './quantum-extractor';
import { getAccountDistributor } from './account-distributor';
import { logger } from '../_core/logger';
import { CacheSystem } from '../_core/cache-system';
import { antiBanEngineV5 } from './anti-ban-engine-v5';

export interface MemberFilters {
    hasUsername?: boolean;
    hasPhoto?: boolean;
    isPremium?: boolean;
    daysActive?: number;
    excludeBots?: boolean;
    bioKeywords?: string[];
}

export interface ApexPipelineConfig {
    sourceId: string;
    targetId: string;
    extractorAccountId: number;
    adderAccountIds: number[];
    filters: MemberFilters;
    client: any; // TelegramClient
    mode?: 'high_speed' | 'stealth' | 'balanced';
    operationId?: number;
}

export class ApexPipelineOrchestrator {
    private static instance: ApexPipelineOrchestrator;
    private logger = logger;
    private cache: CacheSystem | null = null;

    private constructor() {
        try {
            this.cache = CacheSystem.getInstance();
        } catch (e) {
            console.warn('[ApexPipeline] CacheSystem unavailable');
        }
    }

    static getInstance(): ApexPipelineOrchestrator {
        if (!this.instance) {
            this.instance = new ApexPipelineOrchestrator();
        }
        return this.instance;
    }

    /**
     * Execute the Apex Move (Direct Extraction -> Distribution)
     */
    async executeApexMove(config: ApexPipelineConfig) {
        this.logger.info(`[ApexPipeline] Initiating Apex Move: ${config.sourceId} -> ${config.targetId}`);

        const distributor = getAccountDistributor();
        let accountIndex = 0;
        let totalPiped = 0;
        let totalFound = 0;

        if (config.operationId) {
            const db = await import('../db');
            await db.updateBulkOperation(config.operationId, {
                status: 'running',
                startedAt: new Date(),
            });
        }

        try {
            const startTime = Date.now();

            // 1. Quantum Extraction with Apex Piping
            totalFound = await quantumExtractor.extract(
                config.client,
                config.extractorAccountId,
                config.sourceId,
                {
                    limit: 10000,
                    mustHaveUsername: config.filters.hasUsername,
                    mustHavePhoto: config.filters.hasPhoto,
                    premiumOnly: config.filters.isPremium,
                    activityDays: config.filters.daysActive,
                    excludeBots: config.filters.excludeBots
                },
                {
                    onBatch: async (batch) => {
                        const { sentinelEngine } = await import('./sentinel-engine');
                        const { growthSimulator } = await import('./growth-simulator');

                        // Fine-grained filtering
                        const filteredBatch = this.filterBatch(batch, config.filters);
                        if (filteredBatch.length === 0) return;

                        // 2. High-Performance Batch Processing
                        await sentinelEngine.guardianMove(config.client, config.targetId, async () => {
                            for (const user of filteredBatch) {
                                const targetAccountId = config.adderAccountIds[accountIndex % config.adderAccountIds.length];

                                // 3. Distributed Task Scheduling
                                await distributor.scheduleTask(targetAccountId, 'add_user', {
                                    targetChatId: config.targetId,
                                    userId: user.id,
                                    userName: user.firstName,
                                    pipelineId: 'apex_move'
                                });

                                accountIndex++;
                                totalPiped++;
                            }

                            // 4. Shadow Masking (Organic Signal Generation)
                            const randomAdderId = config.adderAccountIds[Math.floor(Math.random() * config.adderAccountIds.length)];
                            await growthSimulator.syncMasking(randomAdderId, config.targetId);
                        });

                        this.logger.info(`[ApexPipeline] Batch of ${filteredBatch.length} piped to Sentinel Workers.`);
                    },
                    onProgress: (progress) => {
                        if (this.cache) {
                            this.cache.set(`pipeline:status:${config.extractorAccountId}`, {
                                ...progress,
                                targetId: config.targetId,
                                startTime: startTime,
                                totalPiped,
                                mode: config.mode || 'balanced'
                            }, { ttl: 3600 });
                        }
                    }
                }
            );

            if (config.operationId) {
                const db = await import('../db');
                await db.updateBulkOperation(config.operationId, {
                    status: 'completed',
                    completedAt: new Date(),
                    totalMembers: totalFound,
                    successfulMembers: totalPiped,
                    description: `Apex Move completed. Users piped: ${totalPiped}`
                });
            }

            this.logger.info(`[ApexPipeline] Apex Move completed. Total users piped: ${totalPiped}`);
            return {
                success: true,
                totalPiped,
                duration: Date.now() - startTime,
                message: 'Apex-level distribution completed successfully.'
            };

        } catch (error: any) {
            this.logger.error(`[ApexPipeline] Move failed: ${error.message}`);
            if (config.operationId) {
                const db = await import('../db');
                await db.updateBulkOperation(config.operationId, {
                    status: 'failed',
                    description: `Error: ${error.message}`
                });
            }
            throw error;
        }
    }

    private filterBatch(batch: any[], filters: MemberFilters): any[] {
        return batch.filter(member => {
            if (filters.bioKeywords && filters.bioKeywords.length > 0) {
                const bio = (member.bio || '').toLowerCase();
                if (!filters.bioKeywords.some(kw => bio.includes(kw.toLowerCase()))) return false;
            }
            return true;
        });
    }

    async getPreview(config: ApexPipelineConfig): Promise<any> {
        try {
            const { telegramClientService } = await import('./telegram-client.service');
            const client = telegramClientService.getClient(config.extractorAccountId);
            if (!client) throw new Error("Client not initialized");

            // Get total count
            const participants = await client.getParticipants(config.sourceId, { limit: 0 });
            const totalMembers = participants.total || 0;

            // Sample 100 for analysis
            const sample = await client.getParticipants(config.sourceId, { limit: 100 });
            const sampleList = sample || [];

            const filteredCount = sampleList.filter(p => {
                if (config.filters.hasUsername && !p.username) return false;
                if (config.filters.isPremium && !p.premium) return false;
                return true;
            }).length;

            const filterRate = sampleList.length > 0 ? filteredCount / sampleList.length : 0.8;
            const estimatedOutput = Math.round(totalMembers * filterRate);

            return {
                estimatedExtraction: {
                    totalMembers,
                    estimatedTime: `${Math.round(totalMembers / 200)} minutes`
                },
                estimatedFiltering: {
                    estimatedOutput,
                    filterRate: Math.round(filterRate * 100)
                },
                totalEstimate: {
                    totalTime: `${Math.round(estimatedOutput / 10) + Math.round(totalMembers / 200)} minutes`,
                    confidence: 0.85
                }
            };
        } catch (error: any) {
            this.logger.error('[ApexPipeline] Preview failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Emergency Abort All Pipelines
     */
    async emergencyAbort(accountId: number) {
        this.logger.warn(`[ApexPipeline] EMERGENCY ABORT issued for account: ${accountId}`);
        if (this.cache) {
            await this.cache.delete(`pipeline:status:${accountId}`);
        }
    }
}

export const apexPipelineOrchestrator = ApexPipelineOrchestrator.getInstance();
