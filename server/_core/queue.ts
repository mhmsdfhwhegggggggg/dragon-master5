import { Queue, QueueEvents, JobsOptions, Job } from "bullmq";
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
  source: string; // link/@/id
  target: string; // link/@/id
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

// BullMQ strictly requires Redis. We do not use Mocks in FALCON Pro.
let connection: IORedis | null = null;
let bulkOpsQueue: Queue;
let bulkOpsEvents: QueueEvents | null = null;

async function initializeQueue() {
  const redisUrl = Secrets.getRedisUrl() || ENV.redisUrl;

  if (!redisUrl) {
    throw new Error('[Queue] FATAL: REDIS_URL is required for production operations. prince.');
  }

  try {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Critical for BullMQ
      enableReadyCheck: false,
    });

    connection.on('error', (err) => {
      console.error('[Queue] Redis connection error:', err.message);
    });

    bulkOpsQueue = new Queue("bulkOps", { connection });
    bulkOpsEvents = new QueueEvents("bulkOps", { connection });

    console.log('[Queue] BullMQ System Connected to Redis 🚀 prince.');
  } catch (error: any) {
    console.error('[Queue] FATAL: Failed to initialize Redis queue:', error.message);
    throw error;
  }
}

// Initialize queue asynchronously
initializeQueue().catch(console.error);

class BullJobQueue {
  async enqueue(type: JobType, payload: JobPayload) {
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
}

export const JobQueue = new BullJobQueue();
export let redis: IORedis | null = null;

export async function cancelJob(jobId: string) {
  const job = await bulkOpsQueue.getJob(jobId);
  if (!job) return { found: false } as const;
  // Move to failed with cancelled reason and allow retries to be ignored
  await (job as any).moveToFailed(new Error("cancelled"), "cancelled", true);
  return { found: true, cancelled: true } as const;
}

export async function listJobs(state: ("waiting" | "active" | "delayed" | "completed" | "failed")[] = ["waiting", "active", "delayed"], start = 0, end = 50) {
  const jobs = await bulkOpsQueue.getJobs(state, start, end);
  return jobs.map((j: any) => ({ id: String(j.id), name: j.name, state: j.getState(), progress: typeof j.progress === 'number' ? j.progress : 0, timestamp: j.timestamp }));
}
