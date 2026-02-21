import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "./env";
import { Secrets } from "./secrets";

export type JobType =
  | "send-bulk-messages"
  | "join-groups"
  | "add-users"
  | "extract-and-add"
  | "send-login-codes"
  | "confirm-login-codes"
  | "post-content"
  | "unban-account"
  | "warm-accounts";

export type SendBulkMessagesPayload = {
  accountId: number;
  userIds: string[];
  messageTemplate: string;
  delayMs: number;
  autoRepeat: boolean;
};

export type JoinGroupsPayload = {
  accountId: number;
  groupLinks: string[];
  delayMs: number;
};

export type AddUsersPayload = {
  accountId: number;
  groupId: string;
  userIds: string[];
  delayMs: number;
};

export type ExtractAndAddPayload = {
  accountId: number;
  source: string;
  target: string;
  extractMode: "all" | "engaged" | "admins";
  daysActive?: number;
  excludeBots: boolean;
  requireUsername: boolean;
  limit?: number;
  dedupeBy: "telegramUserId" | "username";
  delayMs: number;
};

export type PostContentPayload = {
  accountId: number;
  channelId: string;
  type: 'text' | 'image' | 'video' | 'file';
  content: string;
  mediaPath?: string;
  caption?: string;
  silent?: boolean;
  pinned?: boolean;
};

export type UnbanAccountPayload = {
  accountId: number;
};

export type WarmAccountsPayload = {
  accountIds: number[];
};

export type JobPayload =
  | ExtractAndAddPayload
  | SendLoginCodesPayload
  | ConfirmLoginCodesPayload
  | PostContentPayload
  | UnbanAccountPayload
  | WarmAccountsPayload;

export type SendLoginCodesPayload = {
  phoneNumbers: string[];
};

export type ConfirmLoginCodesPayload = {
  userId: number;
  items: { phoneNumber: string; code: string; password?: string }[];
};

export type OnboardingPayload = SendLoginCodesPayload | ConfirmLoginCodesPayload;

// Redis connection for monitoring/anti-ban
export let redis: IORedis | null = null;

// BullMQ optional queue (requires Redis)
let bulkOpsQueue: Queue | null = null;
let bulkOpsEvents: QueueEvents | null = null;
let redisAvailable = false;

async function initializeQueue() {
  const redisUrl = Secrets.getRedisUrl() || ENV.redisUrl;

  if (!redisUrl) {
    console.warn('[Queue] WARNING: REDIS_URL not configured. Background jobs will be unavailable.');
    return;
  }

  try {
    // Test connectivity using ioredis first
    const testConn = new IORedis(redisUrl, {
      connectTimeout: 4000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    await testConn.connect();
    await testConn.ping();

    // Assign to exported redis for use by anti-ban / cache
    redis = testConn;

    redis.on('error', (err) => {
      const isNetworkErr = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].some(c => err.message.includes(c));
      if (!isNetworkErr) {
        console.error('[Queue] Redis error:', err.message);
      }
    });

    // BullMQ uses its own bundled ioredis — pass URL string to avoid version conflict
    const connection = { url: redisUrl, maxRetriesPerRequest: null, enableReadyCheck: false } as any;
    bulkOpsQueue = new Queue("bulkOps", { connection });
    bulkOpsEvents = new QueueEvents("bulkOps", { connection });
    redisAvailable = true;

    console.log('[Queue] BullMQ System Connected to Redis 🚀');
  } catch (error: any) {
    console.warn('[Queue] WARNING: Redis unavailable. Background jobs disabled.', error.message);
    redis = null;
  }
}

// Non-fatal initialization — server starts regardless
initializeQueue().catch((e) => {
  console.warn('[Queue] Non-fatal queue init error:', e.message);
});

class BullJobQueue {
  async enqueue(type: JobType, payload: JobPayload) {
    if (!bulkOpsQueue) {
      throw new Error('[Queue] Redis is not available. Cannot enqueue background jobs. Configure REDIS_URL.');
    }
    const opts: JobsOptions = {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 5000,
      backoff: { type: "exponential", delay: 2000 },
    };
    const job = await bulkOpsQueue.add(type, payload, opts);
    return { id: job.id as string };
  }

  async getJob(id: string) {
    if (!bulkOpsQueue) return undefined;
    const job = await bulkOpsQueue.getJob(id);
    if (!job) return undefined;
    const state = await job.getState();
    const progress = (typeof job.progress === "number" ? job.progress : 0) as number;
    const result = (job as any).returnvalue ?? null;
    const failedReason = job.failedReason || undefined;
    return {
      id: String(job.id),
      status: state as any,
      progress,
      result: result ?? null,
      error: failedReason ?? null,
      createdAt: job.timestamp ? new Date(job.timestamp) : undefined,
      startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };
  }

  isAvailable() {
    return redisAvailable && bulkOpsQueue !== null;
  }
}

export const JobQueue = new BullJobQueue();

export async function cancelJob(jobId: string) {
  if (!bulkOpsQueue) return { found: false } as const;
  const job = await bulkOpsQueue.getJob(jobId);
  if (!job) return { found: false } as const;
  await (job as any).moveToFailed(new Error("cancelled"), "cancelled", true);
  return { found: true, cancelled: true } as const;
}

export async function listJobs(
  state: ("waiting" | "active" | "delayed" | "completed" | "failed")[] = ["waiting", "active", "delayed"],
  start = 0,
  end = 50
) {
  if (!bulkOpsQueue) return [];
  const jobs = await bulkOpsQueue.getJobs(state, start, end);
  return jobs.map((j: any) => ({
    id: String(j.id),
    name: j.name,
    state: j.getState(),
    progress: typeof j.progress === 'number' ? j.progress : 0,
    timestamp: j.timestamp
  }));
}
