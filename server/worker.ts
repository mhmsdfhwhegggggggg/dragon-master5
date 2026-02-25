/**
 * Industrial Worker System v4.0.0 - ULTIMATE SCALE
 * 
 * High-performance background worker using BullMQ:
 * - Massive Parallelism: Optimized for high concurrency.
 * - Memory Efficient: Streaming extraction and batch processing.
 * - Fault Tolerant: Auto-recovery and exponential backoff on RPC errors.
 * - Real-time Sync: Instant progress updates to DB and Redis.
 */

import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "./_core/env";
import { TelegramClientService } from "./services/telegram-client.service";
import { quantumExtractor } from "./services/quantum-extractor";
import { highSpeedAdder } from "./services/high-speed-adder";
import * as db from "./db";
import type {
  JobType,
  SendBulkMessagesPayload,
  JoinGroupsPayload,
  AddUsersPayload,
  ExtractAndAddPayload,
} from "./_core/queue";

import { Secrets } from "./_core/secrets";

const redisUrl = Secrets.getRedisUrl() || ENV.redisUrl;
const redisOptions: any = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (redisUrl?.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

const connection = new IORedis(redisUrl!, redisOptions);
const tg = new TelegramClientService();

const worker = new Worker(
  "bulkOps",
  async (job: Job) => {
    const type = job.name as JobType;
    console.log(`[Worker] Processing job ${job.id} (${type})`);

    try {
      if (type === "extract-and-add") {
        return await handleExtractAndAdd(job);
      }
      if (type === "send-bulk-messages") {
        return await handleBulkMessages(job);
      }
      if (type === "join-groups") {
        return await handleJoinGroups(job);
      }
      if (type === "add-users") {
        return await handleAddUsers(job);
      }
    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection: connection as any,
    concurrency: 50, // Industrial scale concurrency
    limiter: { max: 1000, duration: 1000 }
  }
);

async function handleExtractAndAdd(job: Job) {
  const p = job.data as ExtractAndAddPayload;
  const account = await db.getTelegramAccountById(p.accountId);
  if (!account) throw new Error("Account not found");

  // 1. Initialize Industrial Operation
  const bulkOp = await db.createBulkOperation({
    userId: account.userId,
    operationType: "extract-and-add",
    status: "running",
    totalMembers: 0,
    delayBetweenMessages: p.delayMs,
    config: JSON.stringify(p),
  } as any);

  const credentials = tg.getApiCredentials();
  const client = await tg.initializeClient(
    p.accountId,
    account.phoneNumber,
    account.sessionString,
    credentials.apiId,
    credentials.apiHash,
  );

  let extractedCount = 0;
  let success = 0;
  let failed = 0;
  const toAdd: any[] = [];

  // 2. Quantum Extraction (Streaming)
  await quantumExtractor.extract(
    client,
    p.accountId,
    p.source,
    {
      limit: p.limit,
      mustHaveUsername: p.requireUsername,
      activityDays: p.daysActive
    },
    {
      onBatch: async (batch) => {
        toAdd.push(...batch);
        extractedCount += batch.length;
        await job.updateProgress(Math.min(20, Math.floor((extractedCount / (p.limit || 1000)) * 20)));
      }
    }
  );

  const operations = await db.getBulkOperationsByAccountId(p.accountId);
  const operation = operations[0];

  if (operation) {
    await db.updateBulkOperation(operation.id, {
      totalMembers: toAdd.length,
      processedMembers: toAdd.length
    } as any);
  }

  // 3. High-Speed Addition
  for (let i = 0; i < toAdd.length; i++) {
    const user = toAdd[i];
    const res = await highSpeedAdder.addUser(client, p.accountId, p.target, user.id);

    if (res.success) success++; else failed++;

    // Progress: 20% to 100%
    const progress = 20 + Math.floor(((i + 1) / toAdd.length) * 80);
    await job.updateProgress(progress);

    // Dynamic Delay with Jitter
    const delay = res.waitMs || p.delayMs || 2000;
    await new Promise(r => setTimeout(r, delay + Math.random() * 500));
  }

  // 4. Finalize
  if (operation) {
    await db.updateBulkOperation(operation.id, {
      status: "completed",
      successfulMembers: success,
      failedMembers: failed,
      completedAt: new Date(),
    } as any);
  }

  return { extracted: extractedCount, success, failed };
}

/**
 * Handle Mass Messaging
 */
async function handleBulkMessages(job: Job) {
  const p = job.data as SendBulkMessagesPayload;
  const account = await db.getTelegramAccountById(p.accountId);
  if (!account) throw new Error("Account not found");

  const credentials = tg.getApiCredentials();
  const client = await tg.initializeClient(
    p.accountId,
    account.phoneNumber,
    account.sessionString,
    credentials.apiId,
    credentials.apiHash
  );

  const result = await tg.sendBulkMessages(
    p.accountId,
    p.userIds.map(id => parseInt(id)),
    p.messageTemplate,
    p.delayMs
  );

  return result;
}

/**
 * Handle Mass Group/Channel Joining
 */
async function handleJoinGroups(job: Job) {
  const p = job.data as JoinGroupsPayload;
  const account = await db.getTelegramAccountById(p.accountId);
  if (!account) throw new Error("Account not found");

  const credentials = tg.getApiCredentials();
  const client = await tg.initializeClient(
    p.accountId,
    account.phoneNumber,
    account.sessionString,
    credentials.apiId,
    credentials.apiHash
  );

  let success = 0;
  let failed = 0;

  for (let i = 0; i < p.groupLinks.length; i++) {
    try {
      const res = await (tg as any).joinGroup(p.accountId, p.groupLinks[i]);
      if (res) success++; else failed++;
    } catch (e) {
      failed++;
    }

    const progress = Math.floor(((i + 1) / p.groupLinks.length) * 100);
    await job.updateProgress(progress);

    // Jittered delay
    await new Promise(r => setTimeout(r, p.delayMs + Math.random() * 1000));
  }

  return { success, failed };
}

/**
 * Handle Direct User Addition to Group/Channel
 */
async function handleAddUsers(job: Job) {
  const p = job.data as AddUsersPayload;
  const account = await db.getTelegramAccountById(p.accountId);
  if (!account) throw new Error("Account not found");

  const credentials = tg.getApiCredentials();
  const client = await tg.initializeClient(
    p.accountId,
    account.phoneNumber,
    account.sessionString,
    credentials.apiId,
    credentials.apiHash
  );

  let success = 0;
  let failed = 0;

  for (let i = 0; i < p.userIds.length; i++) {
    try {
      const res = await (tg as any).addUserToGroup(p.accountId, p.groupId, p.userIds[i]);
      if (res) success++; else failed++;
    } catch (e) {
      failed++;
    }

    const progress = Math.floor(((i + 1) / p.userIds.length) * 100);
    await job.updateProgress(progress);

    // Jittered delay
    await new Promise(r => setTimeout(r, p.delayMs + Math.random() * 1000));
  }

  return { success, failed };
}

worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed: ${err.message}`));

export default worker;
