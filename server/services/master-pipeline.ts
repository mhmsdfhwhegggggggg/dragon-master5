/**
 * Master Pipeline v1.0.0 - The Orchestrator
 * 
 * High-performance operation pipeline that:
 * - Pipes data from QuantumExtractor directly to multiple adder accounts.
 * - Dynamic Load Balancing: Distributes users across the available account pool.
 * - Fault Tolerance: Automatically skips or re-routes if an account hits a limit.
 * - Real-time Monitoring: Updates Redis with live progress for the dashboard.
 */

import { quantumExtractor, QuantumFilter } from './quantum-extractor';
import { getAccountDistributor } from './account-distributor';
import { logger } from '../_core/logger';
import { CacheSystem } from '../_core/cache-system';

export interface PipelineConfig {
    sourceId: string;
    targetId: string;
    extractorAccountId: number;
    adderAccountIds: number[];
    filters: QuantumFilter;
    client: any; // TelegramClient
}

export class MasterPipeline {
    private static instance: MasterPipeline;
    private logger = logger;
    private cache = CacheSystem.getInstance();

    private constructor() { }

    static getInstance(): MasterPipeline {
        if (!this.instance) {
            this.instance = new MasterPipeline();
        }
        return this.instance;
    }

    /**
     * Executes a unified "Giant Move" (Extract + Add)
     */
    async executeGiantMove(config: PipelineConfig) {
        this.logger.info(`[MasterPipeline] Starting Giant Move: ${config.sourceId} -> ${config.targetId}`);

        const distributor = getAccountDistributor();
        let totalPiped = 0;
        let accountIndex = 0;

        try {
            // Initiate Quantum Extraction with real-time piping
            totalPiped = await quantumExtractor.extract(
                config.client,
                config.extractorAccountId,
                config.sourceId,
                config.filters,
                {
                    onBatch: async (batch) => {
                        const { sentinelEngine } = await import('./sentinel-engine');
                        const { growthSimulator } = await import('./growth-simulator');

                        // Execute batch under Sentinel protection
                        await sentinelEngine.guardianMove(config.client, config.targetId, async () => {
                            // For each batch, distribute evenly among adder accounts
                            for (const user of batch) {
                                const targetAccountId = config.adderAccountIds[accountIndex % config.adderAccountIds.length];

                                // Schedule task on the server-side worker
                                await distributor.scheduleTask(targetAccountId, 'add_user', {
                                    targetChatId: config.targetId,
                                    userId: user.id,
                                    userName: user.firstName
                                });

                                accountIndex++;
                            }

                            // Trigger Shadow Growth Masking (Views/Reactions) for the batch
                            const randomAdderId = config.adderAccountIds[Math.floor(Math.random() * config.adderAccountIds.length)];
                            await growthSimulator.syncMasking(randomAdderId, config.targetId);
                        });

                        this.logger.info(`[MasterPipeline] Sentinel-protected batch of ${batch.length} piped to workers.`);
                    },
                    onProgress: (progress) => {
                        // Update progress in cache for dashboard
                        this.cache.set(`pipeline:status:${config.extractorAccountId}`, {
                            ...progress,
                            targetId: config.targetId,
                            startTime: Date.now()
                        }, { ttl: 3600 });
                    }
                }
            );

            this.logger.info(`[MasterPipeline] Giant Move completed. Total users piped: ${totalPiped}`);
            return {
                success: true,
                totalPiped,
                message: 'Operation successfully distributed across the account pool.'
            };

        } catch (error: any) {
            this.logger.error(`[MasterPipeline] Operation failed: ${error.message}`);
            throw error;
        }
    }
}

export const masterPipeline = MasterPipeline.getInstance();
