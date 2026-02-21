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
import { industrialExtractor } from "./services/industrial-extractor";
import { highSpeedAdder } from "./services/high-speed-adder";
import * as db from "./db";
import type {
  JobType,
  SendBulkMessagesPayload,
  JoinGroupsPayload,
  ExtractAndAddPayload,
  PostContentPayload,
  UnbanAccountPayload,
  WarmAccountsPayload,
} from "./_core/queue";
import { aiUnbanEngine } from "./services/ai-unban-engine";
import { aiWarmingEngine } from "./services/ai-warming-engine";

const connection = new IORedis(ENV.redisUrl);
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
      if (type === "post-content") {
        return await handlePostContent(job);
      }
      if (type === "unban-account") {
        return await handleUnbanAccount(job);
      }
      if (type === "warm-accounts") {
        return await handleWarmAccounts(job);
      }
    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection,
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
    userId: p.accountId,
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

  // 2. Industrial Extraction (Streaming)
  await industrialExtractor.industrialExtract(
    client,
    p.accountId,
    p.source,
    {
      limit: p.limit,
      hasUsername: p.requireUsername,
      activityDays: p.daysActive
    },
    async (batch) => {
      toAdd.push(...batch);
      extractedCount += batch.length;
      await job.updateProgress(Math.min(20, Math.floor((extractedCount / (p.limit || 1000)) * 20)));
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

  const res = await tg.sendBulkMessages(p.accountId, p.userIds.map(id => parseInt(id)), p.messageTemplate, p.delayMs);
  await tg.disconnectClient(p.accountId);
  return res;
}

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
    const link = p.groupLinks[i];
    try {
      const res = await tg.joinGroup(p.accountId, link);
      if (res) success++; else failed++;
    } catch (e) {
      failed++;
    }
    await job.updateProgress(Math.floor(((i + 1) / p.groupLinks.length) * 100));
    await new Promise(r => setTimeout(r, p.delayMs + Math.random() * 1000));
  }

  await tg.disconnectClient(p.accountId);
  return { success, failed };
}

async function handlePostContent(job: Job) {
  const p = job.data as PostContentPayload;
  const channelService = (await import("./services/channel-management.service")).channelManagement;

  await channelService.postContent(p.accountId, p.channelId, {
    type: p.type,
    content: p.content,
    mediaPath: p.mediaPath,
    caption: p.caption,
    silent: p.silent,
    pinned: p.pinned
  });

  return { success: true };
}

async function handleUnbanAccount(job: Job) {
  const { accountId } = job.data;
  const account = await db.getTelegramAccountById(accountId);
  if (!account) throw new Error("Account not found");

  const credentials = tg.getApiCredentials();
  const client = await tg.initializeClient(
    accountId,
    account.phoneNumber,
    account.sessionString,
    credentials.apiId,
    credentials.apiHash
  );

  const res = await aiUnbanEngine.appealBan(client, accountId, account.phoneNumber);
  await tg.disconnectClient(accountId);
  return res;
}

async function handleWarmAccounts(job: Job) {
  const { accountIds } = job.data;
  const results = [];

  for (let i = 0; i < accountIds.length; i++) {
    const accountId = accountIds[i];
    try {
      const account = await db.getTelegramAccountById(accountId);
      if (!account) continue;

      const credentials = tg.getApiCredentials();
      const client = await tg.initializeClient(
        accountId,
        account.phoneNumber,
        account.sessionString,
        credentials.apiId,
        credentials.apiHash
      );

      await aiWarmingEngine.performWarmingSession(client, accountId);
      await tg.disconnectClient(accountId);
      results.push({ accountId, success: true });
    } catch (e: any) {
      results.push({ accountId, success: false, error: e.message });
    }
    await job.updateProgress(Math.floor(((i + 1) / accountIds.length) * 100));
  }

  return results;
}

worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed: ${err.message}`));

export default worker;
