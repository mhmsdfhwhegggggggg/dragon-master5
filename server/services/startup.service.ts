/**
 * Startup Service 🚀
 * 
 * Orchestrates the initialization of all background services and listeners.
 */
import { telegramClientService } from './telegram-client.service';
import { autoReplyService } from './auto-reply.service';
import { contentClonerService } from './content-cloner.service';
import { logger } from '../_core/logger';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import { Secrets } from '../_core/secrets';
import { apexResilience } from '../_core/resilience';
import { apexOrchestrator } from './apex-orchestrator.service';

export class StartupService {
    /**
     * Initialize all services
     */
    static async initializeAllServices() {
        logger.info('[Startup] Starting services initialization...');

        // 0. Auto-Heal Schema (Fixes Render migration issues)
        try {
            await SchemaHealer.heal();
        } catch (e) {
            logger.error('[Startup] Schema healing failed', e);
        }

        // 1. Integrity Check
        try {
            const { IntegrityChecker } = await import('../_core/integrity-checker');
            const isIntegrityOk = await IntegrityChecker.initialize();
            if (!isIntegrityOk) {
                logger.error('[Startup] Integrity check failed! Critical files tampered with.');
                // In production, we might want to exit here
            }
        } catch (e) {
            logger.warn('[Startup] Integrity checker failed');
        }

        try {
            // 2. Ensure Admin exists (Self-Healing Admin)
            await this.ensureAdminExists();

            // 3. Connect all active Telegram accounts
            await this.connectActiveAccounts();

            // 4. Initialize Service Listeners
            await this.initializeServiceListeners();

            logger.info('[Startup] All services initialized successfully');
        } catch (error: any) {
            logger.error('[Startup] Initialization failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    private static async ensureAdminExists() {
        const email = process.env.ADMIN_EMAIL || 'admin@falcon.pro';
        const password = process.env.ADMIN_PASSWORD || process.env.JWT_SECRET?.slice(0, 20) || 'secure_admin_password';
        const name = process.env.ADMIN_NAME || 'Falcon Admin';

        const database = await db.getDb();
        if (!database) return;

        const existing = await db.getUserByEmail(email);
        if (!existing) {
            logger.info(`[Startup] No admin found. Creating auto-admin: ${email}...`);
            await db.createUser({
                email,
                password, // Note: Should be hashed in production if db.createUser doesn't do it
                username: name,
                role: 'admin',
                isActive: true
            });
            logger.info('[Startup] Auto-Admin created successfully! 🛡️');
        } else {
            logger.info('[Startup] Admin check: OK.');
        }
    }

    private static async connectActiveAccounts() {
        logger.info('[Startup] Connecting active Telegram accounts...');
        const database = await db.getDb();
        if (!database) return;

        const accounts = await database.select().from(db.telegramAccounts).where(eq(db.telegramAccounts.isActive, true));

        for (const account of accounts) {
            try {
                await telegramClientService.initializeClient(
                    account.id,
                    account.phoneNumber,
                    account.sessionString
                );
                logger.info(`[Startup] Connected account ${account.id} (${account.phoneNumber})`);
            } catch (error: any) {
                logger.error(`[Startup] Failed to connect account ${account.id}`, { error: error.message });
            }
        }

        logger.info(`[Startup] Connected ${accounts.length} accounts`);
    }

    private static async initializeServiceListeners() {
        const database = await db.getDb();
        if (!database) return;

        // Auto Reply Listeners
        const replyRules = await database.select().from(db.autoReplyRules).where(eq(db.autoReplyRules.isActive, true));
        for (const rule of replyRules) {
            await autoReplyService.ensureAccountMonitoring(rule.telegramAccountId);
        }

        // Content Cloner Listeners
        // Ensure Content Cloner is initialized and monitoring active accounts
        await contentClonerService.initialize();
    }
}

/**
 * Schema Healer 🩺
 * Automatically renames legacy camelCase columns to snake_case in production.
 */
class SchemaHealer {
    static async heal() {
        const database = await db.getDb();
        if (!database) return;

        logger.info('[SchemaHealer] Checking and healing database schema...');

        const renames: Record<string, Record<string, string>> = {
            'users': {
                'isActive': 'is_active',
                'createdAt': 'created_at',
                'updatedAt': 'updated_at'
            },
            'telegram_accounts': {
                'userId': 'user_id',
                'phoneNumber': 'phone_number',
                'telegramId': 'telegram_id',
                'firstName': 'first_name',
                'lastName': 'last_name',
                'sessionString': 'session_string',
                'isActive': 'is_active',
                'isRestricted': 'is_restricted',
                'restrictionReason': 'restriction_reason',
                'warmingLevel': 'warming_level',
                'messagesSentToday': 'messages_sent_today',
                'dailyLimit': 'daily_limit',
                'lastActivityAt': 'last_activity_at',
                'lastRestrictedAt': 'last_restricted_at',
                'deviceSignature': 'device_signature',
                'hardwareId': 'hardware_id',
                'createdAt': 'created_at',
                'updatedAt': 'updated_at'
            },
            'content_cloner_rules': {
                'userId': 'user_id',
                'telegramAccountId': 'telegram_account_id',
                'sourceChannelIds': 'source_channel_ids',
                'targetChannelIds': 'target_channel_ids',
                'isActive': 'is_active',
                'lastRunAt': 'last_run_at',
                'totalCloned': 'total_cloned',
                'createdAt': 'created_at',
                'updatedAt': 'updated_at'
            }
        };

        for (const [table, columns] of Object.entries(renames)) {
            try {
                // Get existing columns
                const existingColsResult = await (database as any).execute(db.sql`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = ${table}
                `);
                const existingCols = existingColsResult.map((c: any) => c.column_name);

                for (const [oldName, newName] of Object.entries(columns)) {
                    if (existingCols.includes(oldName) && !existingCols.includes(newName)) {
                        logger.info(`[SchemaHealer] Renaming legacy column "${oldName}" to "${newName}" in table "${table}"...`);
                        await (database as any).execute(db.sql.raw(`ALTER TABLE "${table}" RENAME COLUMN "${oldName}" TO "${newName}"`));
                    }
                }
            } catch (err: any) {
                logger.warn(`[SchemaHealer] Warning: Failed to heal table "${table}":`, err.message);
            }
        }

        logger.info('[SchemaHealer] Schema check completed.');
    }
}
