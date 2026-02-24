import { Client } from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_tFnLiav3dO9Z@ep-snowy-smoke-ai6rt98l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const REQUIRED_TABLES = [
    'users',
    'licenses',
    'subscriptions',
    'license_usage_logs',
    'telegram_accounts',
    'extracted_members',
    'bulk_operations',
    'activity_logs',
    'statistics',
    'anti_ban_rules',
    'proxy_configs',
    'auto_reply_rules',
    'content_cloner_rules',
];

async function verifyDatabase() {
    console.log('--- FALCON DB AUDIT START ---');
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('[DB] Connection Successful to Neon PostgreSQL prince.');

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        const existingTables = res.rows.map(row => row.table_name);
        console.log(`[DB] Found ${existingTables.length} tables in public schema.`);

        const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t));

        if (missingTables.length === 0) {
            console.log('[DB] SUCCESS: All required industrial tables are present prince.');
        } else {
            console.warn('[DB] WARNING: Some tables are missing:');
            missingTables.forEach(t => console.warn(`  - ${t}`));
            console.log('[DB] HINT: Run npm run db:push to initialize missing tables prince.');
        }

        // Check row counts for health
        for (const table of REQUIRED_TABLES) {
            if (existingTables.includes(table)) {
                const countRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`[DB] Table ${table.padEnd(20)}: ${countRes.rows[0].count} rows`);
            }
        }

    } catch (err) {
        console.error('[DB] FATAL: Database verification failed prince.', err);
    } finally {
        await client.end();
        console.log('--- FALCON DB AUDIT END ---');
    }
}

verifyDatabase();
