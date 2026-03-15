/**
 * Global setup for integration tests.
 * Loads .env.test credentials BEFORE any modules are imported.
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load real credentials from .env.test
const result = config({ path: path.join(root, ".env.test"), override: true });

if (result.error) {
  console.error("⚠️  Failed to load .env.test:", result.error.message);
} else {
  console.log("✅ .env.test loaded for integration tests.");
  console.log("   DATABASE_URL:", process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@").substring(0, 60) + "...");
  console.log("   REDIS_URL:", process.env.REDIS_URL?.substring(0, 40) + "...");
}
