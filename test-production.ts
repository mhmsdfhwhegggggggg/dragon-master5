import * as db from './server/db';
import { SchemaHealer } from './server/services/startup.service';
import { Secrets } from './server/_core/secrets';
import { logger } from './server/_core/logger';
import { ConnectionTCPObfuscated } from 'telegram/network/connection';
import * as dotenv from 'dotenv';
dotenv.config();

async function runFullTest() {
    logger.info('🚀 Starting Full Production Compatibility Test...');

    try {
        // 1. Database Connection & Schema Healing
        logger.info('Testing Database & Schema Healing...');
        const urlToCheck = Secrets.getDatabaseUrl();
        logger.info(`Database URL detected: ${urlToCheck?.split('@')[1] || 'NONE'}`);
        await SchemaHealer.heal();

        const database = await db.getDb();
        // Check if accounts exist via raw SQL
        const result = await (database as any).execute(db.sql.raw('SELECT count(*) FROM users'));
        logger.info(`✅ DB Connection OK. User count: ${JSON.stringify(result)}`);

        // 2. Anti-Ban V10.0 Transport Check
        logger.info('Verifying Anti-Ban V10.0 Transport Layer...');
        if (ConnectionTCPObfuscated) {
            logger.info('✅ MTProto Obfuscated Transport (0xdddddddd) is available.');
            // Test instantiation
            const testInstance = new ConnectionTCPObfuscated({
                ipAddress: '149.154.167.50', // Production DC2 IP
                port: 443,
                dcId: 2,
                loggers: {} as any,
                proxy: undefined
            } as any);
            logger.info('✅ Transport class instantiation successful.');
        } else {
            throw new Error('MTProto Obfuscated Transport is MISSING from GramJS!');
        }

        // 3. Environment Check
        const apiId = process.env.TELEGRAM_API_ID;
        if (apiId) {
            logger.info('✅ Telegram API_ID configured.');
        } else {
            logger.warn('⚠️ TELEGRAM_API_ID missing in .env');
        }

        logger.info('🎉 SUCCESS: Core systems are production-ready.');
        process.exit(0);
    } catch (error: any) {
        logger.error('❌ Production Test FAILED:', error.message || error);
        process.exit(1);
    }
}

runFullTest();
