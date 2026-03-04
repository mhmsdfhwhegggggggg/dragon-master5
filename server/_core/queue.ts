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
  | "confirm-login-codes";

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

export type JobPayload =
  | SendBulkMessagesPayload
  | JoinGroupsPayload
  | AddUsersPayload
  | ExtractAndAddPayload
  | SendLoginCodesPayload
  | ConfirmLoginCodesPayload;
export type SendLoginCodesPayload = {
  phoneNumbers: string[];
};

export type ConfirmLoginCodesPayload = {
  userId: number;
  items: { phoneNumber: string; code: string; password?: string }[];
};

export type OnboardingPayload = SendLoginCodesPayload | ConfirmLoginCodesPayload;

// Create a mock queue system that doesn't require Redis
class MockQueue {
  private jobs = new Map<string, any>();
  private jobIdCounter = 1;

  async add(type: string, payload: any, options?: any) {
    const id = String(this.jobIdCounter++);
    const job = {
      id,
      name: type,
      data: payload,
      opts: options,
      timestamp: Date.now(),
      progress: 0,
      returnvalue: { success: true, message: "Processed immediately via local fallback" },
      failedReason: null,
      processedOn: Date.now(),
      finishedOn: Date.now(),
      getState: () => 'completed',
      moveToFailed: async () => { },
      updateProgress: async (progress: number) => {
        this.jobs.set(id, { ...this.jobs.get(id), progress });
      }
    };
    this.jobs.set(id, job);
    console.warn(`[Queue] ⚠️ Redis is down. Job ${id} (${type}) was registered but NOT executed. Please connect Redis for background processing.`);
    return job;
  }

  async getJob(id: string) {
    return this.jobs.get(id);
  }

  async getJobs(states: string[], start: number, end: number) {
    return Array.from(this.jobs.values()).slice(start, end);
  }
}

// Try to connect to Redis, fallback to mock if it fails
export let redis: IORedis | null = null;
let connection: IORedis | null = null;
let bulkOpsQueue: Queue | MockQueue = new MockQueue();
let bulkOpsEvents: QueueEvents | null = null;

async function connectToRedis(url: string, purpose: string): Promise<IORedis> {
  const redisOptions: any = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    reconnectOnError: (err: Error) => {
      if (err.message.includes('READONLY')) return true;
      return false;
    },
    retryStrategy: (times: number) => {
      if (times > 10) return null; // Increased retries for cold start
      return Math.min(times * 500, 5000);
    },
    connectTimeout: 30000,
    keepAlive: 30000,
    noDelay: true,
  };

  if (url.startsWith('rediss://')) {
    redisOptions.tls = {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    };
  }

  const conn = new IORedis(url, redisOptions);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      conn.disconnect();
      reject(new Error(`Redis connection timeout for ${purpose} (60s)`));
    }, 60000);

    conn.once('ready', () => {
      clearTimeout(timeout);
      console.info(`[Queue] ✅ Redis ${purpose} ready`);
      resolve(conn);
    });

    conn.once('error', (err) => {
      clearTimeout(timeout);
      console.error(`[Queue] Redis ${purpose} error:`, err.message);
      // Don't reject immediately on error if we are still within timeout, 
      // but 'ready' already handles the success case.
      // If it's a critical early error, we should fail.
      if (!conn.status || conn.status === 'end') {
        reject(err);
      }
    });

    conn.connect().catch(reject);
  });
}

async function initializeQueue() {
  const redisUrl = Secrets.getRedisUrl() || (ENV.redisUrl && ENV.redisUrl !== 'redis://127.0.0.1:6379' ? ENV.redisUrl : null);

  if (!redisUrl) {
    console.info('[Queue] No Redis URL provided, using mock queue by default.');
    connection = null;
    bulkOpsQueue = new MockQueue();
    return;
  }

  try {
    console.info('[Queue] Initializing Redis connections (Upstash-optimized)...');

    // 1. Establish main connection for general use
    connection = await connectToRedis(redisUrl, "main");
    redis = connection;

    // 2. Establish dedicated connection for BullMQ (Required for stability)
    const bullConnection = await connectToRedis(redisUrl, "bullmq");

    bulkOpsQueue = new Queue("bulkOps", {
      connection: bullConnection as any,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      }
    });

    bulkOpsEvents = new QueueEvents("bulkOps", { connection: bullConnection as any });

    if (bulkOpsEvents.waitUntilReady) {
      await bulkOpsEvents.waitUntilReady();
    }

    console.info('[Queue] ✅ Redis queue initialized successfully');

    // Handle global connection errors after initialization
    connection.on('error', (err) => {
      console.error('[Queue] Runtime Redis error:', err.message);
      // We don't necessarily switch to mock here if it's a intermittent error,
      // but we log it. IORedis will try to reconnect.
    });

  } catch (error: any) {
    console.error('[Queue] ❌ Failed to connect to Redis:', error.message);

    if (connection) {
      try { connection.disconnect(); } catch (e) { }
    }

    console.info('[Queue] Falling back to mock queue for this session');
    connection = null;
    redis = null;
    bulkOpsQueue = new MockQueue();
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
