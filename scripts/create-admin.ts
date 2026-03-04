import "dotenv/config";
import { getDb } from "../server/db";
import { hashPassword } from "../server/_core/crypto";
import { users } from "../server/db/schema";

async function main() {
    const db = await getDb();
    if (!db) {
        console.error("Failed to connect to database");
        process.exit(1);
    }

    try {
        const adminEmail = "admin@example.com";
        const adminPassword = "password123"; // TODO: Change this immediately in production

        await db.insert(users).values({
            email: adminEmail,
            password: await hashPassword(adminPassword),
            username: "admin",
            role: "admin",
        } as any).onConflictDoNothing();

        console.log(`Admin user '${adminEmail}' created successfully or already exists.`);
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        process.exit(0);
    }
}

main();
