import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL || '';
const sql = postgres(url, { ssl: 'require' });

async function diagnose() {
    try {
        const cols = await sql`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
        console.log('=== USERS TABLE COLUMNS ===');
        cols.forEach(c => console.log(` - ${c.column_name}: nullable=${c.is_nullable}, default=${c.column_default}`));

        const cnt = await sql`SELECT count(*) as n FROM users`;
        console.log('\n=== USER COUNT ===', cnt[0].n);

        // Try a test insert to get real error
        const testEmail = 'diag_' + Date.now() + '@test.com';
        const inserted = await sql`
      INSERT INTO users (username, email, password, "isActive", role)
      VALUES ('DiagUser_' || ${Date.now():: text
    }, ${ testEmail }, 'testhash', true, 'user')
      RETURNING id, username, email
        `;
    console.log('\n=== TEST INSERT OK ===', inserted[0]);
    // Cleanup
    await sql`DELETE FROM users WHERE email = ${ testEmail } `;
    console.log('Cleanup done.');
  } catch(e: any) {
    console.error('\n=== INSERT ERROR ===', e.message);
  } finally {
    await sql.end();
  }
}

diagnose();
