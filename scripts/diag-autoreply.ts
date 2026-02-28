import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL || '';
const sql = postgres(url, { ssl: 'require' });

async function diagnose() {
    try {
        console.log('=== CHECKING AUTO_REPLY_RULES TABlE ===');
        const tableCheck = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auto_reply_rules')`;
        console.log('Table exists:', tableCheck[0].exists);

        if (tableCheck[0].exists) {
            const cols = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'auto_reply_rules'`;
            console.log('Columns:');
            cols.forEach(c => console.log(` - ${c.column_name} (${c.data_type}, nullable=${c.is_nullable})`));
        } else {
            console.log('Table auto_reply_rules MISSING!');
        }

    } catch (e: any) {
        console.error('Diagnostic error:', e.message);
    } finally {
        await sql.end();
    }
}

diagnose();
