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

const connection = new IORedis(Secrets.getRedisUrl() || ENV.redisUrl, {
  maxRetriesPerRequest: null,
});
const queueName = "bulkOps";
const bulkOpsQueue = new Queue(queueName, { connection });
const bulkOpsEvents = new QueueEvents(queueName, { connection });
void bulkOpsEvents.waitUntilReady();

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
export const redis = connection;

export async function cancelJob(jobId: string) {
  const job = await bulkOpsQueue.getJob(jobId);
  if (!job) return { found: false } as const;
  // Move to failed with cancelled reason and allow retries to be ignored
  await (job as any).moveToFailed(new Error("cancelled"), "cancelled", true);
  return { found: true, cancelled: true } as const;
}

export async function listJobs(state: ("waiting"|"active"|"delayed"|"completed"|"failed")[] = ["waiting","active","delayed"], start = 0, end = 50) {
  const jobs = await bulkOpsQueue.getJobs(state, start, end);
  return jobs.map((j: any) => ({ id: String(j.id), name: j.name, state: j.getState(), progress: typeof j.progress === 'number' ? j.progress : 0, timestamp: j.timestamp }));
}
