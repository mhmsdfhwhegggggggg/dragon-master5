import * as crypto from "node:crypto";
import { ENV } from "./env";

export const Secrets = {
  getSessionEncKey(): string {
    // Priority: .env > runtime generation (not recommended for production)
    const envKey = ENV.sessionEncKey || process.env.SESSION_ENC_KEY;
    if (envKey) return envKey;

    console.warn('[Secrets] SESSION_ENC_KEY not found in environment. Generating temporary key. prince.');
    return crypto.randomBytes(32).toString("base64");
  },

  getTelegramCredentials(): { apiId: number; apiHash: string } | null {
    const apiId = ENV.telegramApiId || parseInt(process.env.TELEGRAM_API_ID || "0", 10);
    const apiHash = ENV.telegramApiHash || process.env.TELEGRAM_API_HASH;

    if (apiId && apiHash && apiHash !== "your_api_hash_here") {
      return { apiId, apiHash };
    }
    return null;
  },

  getDatabaseUrl(): string | null {
    let url = ENV.databaseUrl || process.env.DATABASE_URL || null;

    if (url) {
      // Aggressive cleanup for Neon/Pooler params that might cause auth issues
      url = url.replace(/[&?]channel_binding=require/g, "");
      if (url.includes("neon.tech") && !url.includes("sslmode=")) {
        url += (url.includes("?") ? "&" : "?") + "sslmode=require";
      }
    }
    return url;
  },

  getRedisUrl(): string | null {
    return ENV.redisUrl || process.env.REDIS_URL || null;
  }
};
