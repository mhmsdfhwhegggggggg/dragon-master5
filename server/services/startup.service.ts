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
        // This is the CRITICAL first step. It ensures DB columns match code.
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
            }
        } catch (e) {
            logger.warn('[Startup] Integrity checker failed');
        }

        try {
            // 2. Ensure Admin exists (Self-Healing Admin)
            await this.ensureAdminExists();

            // 3. Connect all active Telegram accounts
            await this.connectActiveAccounts();

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
                password,
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

        // Load rules first (Now that schema is healed)
        await contentClonerService.initialize();
        await autoReplyService.initializeListeners();

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
}

/**
 * Schema Healer 🩺 - Hammer Edition 2.0 🔨
 * Enforces column existence and naming. Gracefully handles existing schema.
 * This is the ultimate fallback for Render deployment issues.
 */
class SchemaHealer {
    static async heal() {
        const database = await db.getDb();
        if (!database) return;

        logger.info('[SchemaHealer] Hammer Strategy 2.0: Healing database schema...');

        // 1. Rename Tasks (Legacy -> Snake Case)
        const renames: Array<{ table: string; old: string; new: string }> = [
            { table: 'users', old: 'isActive', new: 'is_active' },
            { table: 'users', old: 'createdAt', new: 'created_at' },
            { table: 'users', old: 'updatedAt', new: 'updated_at' },
            { table: 'telegram_accounts', old: 'userId', new: 'user_id' },
            { table: 'telegram_accounts', old: 'phoneNumber', new: 'phone_number' },
            { table: 'telegram_accounts', old: 'telegramId', new: 'telegram_id' },
            { table: 'telegram_accounts', old: 'firstName', new: 'first_name' },
            { table: 'telegram_accounts', old: 'lastName', new: 'last_name' },
            { table: 'telegram_accounts', old: 'sessionString', new: 'session_string' },
            { table: 'telegram_accounts', old: 'isActive', new: 'is_active' },
            { table: 'telegram_accounts', old: 'isRestricted', new: 'is_restricted' },
            { table: 'telegram_accounts', old: 'restrictionReason', new: 'restriction_reason' },
            { table: 'telegram_accounts', old: 'warmingLevel', new: 'warming_level' },
            { table: 'telegram_accounts', old: 'messagesSentToday', new: 'messages_sent_today' },
            { table: 'telegram_accounts', old: 'dailyLimit', new: 'daily_limit' },
            { table: 'telegram_accounts', old: 'lastActivityAt', new: 'last_activity_at' },
            { table: 'telegram_accounts', old: 'lastRestrictedAt', new: 'last_restricted_at' },
            { table: 'telegram_accounts', old: 'deviceSignature', new: 'device_signature' },
            { table: 'telegram_accounts', old: 'hardwareId', new: 'hardware_id' },
            { table: 'telegram_accounts', old: 'createdAt', new: 'created_at' },
            { table: 'telegram_accounts', old: 'updatedAt', new: 'updated_at' },
            { table: 'content_cloner_rules', old: 'userId', new: 'user_id' },
            { table: 'content_cloner_rules', old: 'telegramAccountId', new: 'telegram_account_id' },
            { table: 'content_cloner_rules', old: 'isActive', new: 'is_active' },
            { table: 'content_cloner_rules', old: 'createdAt', new: 'created_at' },
            { table: 'content_cloner_rules', old: 'updatedAt', new: 'updated_at' }
        ];

        for (const task of renames) {
            try {
                await (database as any).execute(db.sql.raw(`ALTER TABLE "${task.table}" RENAME COLUMN "${task.old}" TO "${task.new}"`));
                logger.info(`[SchemaHealer] Renamed "${task.old}" to "${task.new}" in "${task.table}"`);
            } catch (err: any) {
                // Ignore if it doesn't exist or already renamed
            }
        }

        // 2. Column Creation Tasks (For missing columns after failed migration)
        const additions: Array<{ table: string; column: string; type: string }> = [
            { table: 'telegram_accounts', column: 'device_signature', type: 'text' },
            { table: 'telegram_accounts', column: 'hardware_id', type: 'varchar(255)' },
            { table: 'users', column: 'role', type: 'varchar(50) DEFAULT \'user\'' },
            { table: 'content_cloner_rules', column: 'source_channel_ids', type: 'text[]' },
            { table: 'content_cloner_rules', column: 'target_channel_ids', type: 'text[]' }
        ];

        for (const task of additions) {
            try {
                // Check if column exists first (Postgres specific)
                const exists = await (database as any).execute(db.sql`
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = ${task.table} AND column_name = ${task.column}
                `);

                if (exists.length === 0) {
                    logger.info(`[SchemaHealer] Adding missing column "${task.column}" to table "${task.table}"...`);
                    await (database as any).execute(db.sql.raw(`ALTER TABLE "${task.table}" ADD COLUMN IF NOT EXISTS ${task.column} ${task.type}`));
                }
            } catch (err: any) {
                logger.debug(`[SchemaHealer] Failed to add column "${task.column}": ${err.message}`);
            }
        }

        logger.info('[SchemaHealer] Hammer Strategy 2.0 completed.');
    }
}
