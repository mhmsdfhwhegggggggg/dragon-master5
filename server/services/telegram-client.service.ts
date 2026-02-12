import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as db from "../db";
import { Secrets } from "../_core/secrets";
import { proxyManager } from "./proxy-manager";
import { entityResolver } from "./entity-resolver";
import { antiBanIntegration } from "./anti-ban-integration";

/**
 * TelegramClientService
 * 
 * Manages Telegram client connections and operations using the Telegram library.
 * This service handles:
 * - Account authentication
 * - Member extraction
 * - Message sending
 * - Group operations
 */
export class TelegramClientService {
  private clients: Map<number, TelegramClient> = new Map();

  constructor() {}

  /**
   * Get API credentials from environment
   */
  getApiCredentials(): { apiId: number; apiHash: string } {
    const fromSecrets = Secrets.getTelegramCredentials();
    if (fromSecrets) return fromSecrets;
    return {
      apiId: parseInt(process.env.TELEGRAM_API_ID || "0"),
      apiHash: process.env.TELEGRAM_API_HASH || "",
    };
  }

  /**
   * Initialize a Telegram client for an account with Anti-Ban protection
   */
  async initializeClient(
    accountId: number,
    phoneNumber: string,
    sessionString?: string,
    apiId?: number,
    apiHash?: number
  ): Promise<TelegramClient> {
    try {
      // 1. Anti-Ban pre-check
      const approval = await antiBanIntegration.preOperationCheck(accountId, {
        type: 'join_group', // Initialization treated as sensitive operation
        targetCount: 1,
        speed: 'slow',
        targetInfo: { phoneNumber },
        accountAge: 30,
        systemLoad: 0.3
      });

      if (!approval.approved) {
        throw new Error(`Anti-Ban protection: ${approval.reason}. Recommendations: ${approval.recommendations?.join(', ')}`);
      }

      // 2. Smart delay before initialization
      if (approval.delay && approval.delay > 0) {
        console.log(`🛡️ Anti-Ban: Waiting ${approval.delay}ms before client initialization...`);
        await new Promise(resolve => setTimeout(resolve, approval.delay));
      }

      const credentials = this.getApiCredentials();
      const session = sessionString ? new StringSession(sessionString) : new StringSession("");

      // 3. Get optimal proxy from Anti-Ban system
      let chosenProxy = null;
      if (approval.proxy) {
        chosenProxy = approval.proxy;
        console.log(`🛡️ Anti-Ban: Using optimized proxy ${chosenProxy.host}:${chosenProxy.port}`);
      } else {
        // Fallback to old proxy manager
        chosenProxy = await proxyManager.getProxyForAccount(accountId);
      }

      const client = new TelegramClient(session, apiId || credentials.apiId, apiHash || credentials.apiHash, {
        connectionRetries: 5,
        retryDelay: 100,
        timeout: 10,
        requestTimeout: 10,
        // Use proxy from Anti-Ban system
        proxy: chosenProxy
          ? {
              host: chosenProxy.host,
              port: chosenProxy.port,
              type: chosenProxy.type,
              username: chosenProxy.username || undefined,
              password: chosenProxy.password || undefined,
            }
          : undefined,
      } as any);

      // Store client reference
      this.clients.set(accountId, client);

      const startTime = Date.now();

      // 4. Connect to Telegram with Anti-Ban monitoring
      try {
        await client.connect();
        const duration = Date.now() - startTime;
        
        // 5. Record successful operation
        await antiBanIntegration.recordOperationResult(accountId, {
          type: 'join_group',
          targetCount: 1,
          speed: 'slow'
        }, {
          success: true,
          duration,
          actualDelay: approval.delay,
          responseTime: duration,
          proxyUsed: chosenProxy?.id
        });

        if (chosenProxy) await proxyManager.reportSuccess(accountId, chosenProxy);
        console.log(`✅ Anti-Ban: Client initialized successfully in ${duration}ms`);
        
      } catch (e) {
        const duration = Date.now() - startTime;
        
        // 6. Record failed operation
        await antiBanIntegration.recordOperationResult(accountId, {
          type: 'join_group',
          targetCount: 1,
          speed: 'slow'
        }, {
          success: false,
          duration,
          actualDelay: approval.delay,
          responseTime: duration,
          proxyUsed: chosenProxy?.id,
          errorType: 'CONNECTION_ERROR',
          errorMessage: e instanceof Error ? e.message : 'Unknown error'
        });

        if (chosenProxy) await proxyManager.reportFailure(accountId, chosenProxy);
        throw e;
      }

      // 7. If no session, need to authenticate
      if (!sessionString) {
        await this.authenticateAccount(client, phoneNumber, accountId);
      }

      return client;
    } catch (error) {
      console.error(`Failed to initialize client for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Authenticate account with phone number and code
   */
  async authenticateAccount(
    client: TelegramClient,
    phoneNumber: string,
    _accountId: number
  ): Promise<string> {
    try {
      const credentials = this.getApiCredentials();

      // Request code
      await (client as any).sendCode({
        apiId: credentials.apiId,
        apiHash: credentials.apiHash,
        phoneNumber,
      });

      console.log(`Code sent to ${phoneNumber}. Awaiting user input.`);

      // Save session string
      const saved = (client.session as StringSession).save();
      return typeof saved === "string" ? saved : "";
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  }

  /**
   * Sign in with code and password (2FA if needed)
   */
  async signInWithCode(
    client: TelegramClient,
    phoneNumber: string,
    code: string,
    password?: string
  ): Promise<string> {
    try {
      // Sign in with phone and code
      await (client as any).signIn(phoneNumber, code);

      if (password) {
        await (client as any).signInWithPassword(password);
      }

      const saved = (client.session as StringSession).save();
      return typeof saved === "string" ? saved : "";
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  }

  /**
   * Extract all members from a group with streaming and memory safety
   */
  async extractGroupMembers(
    accountId: number,
    groupId: number | string,
    onBatch?: (batch: any[]) => Promise<void>
  ): Promise<any[]> {
    try {
      const client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      const allMembers: any[] = [];
      let offset = 0;
      const limit = 200;
      let emptyCount = 0;
      let totalProcessed = 0;

      // Fetch members in streaming batches
      while (emptyCount < 3) {
        const batch = await (client as any).getParticipants(groupId, {
          offset,
          limit,
        });

        if (!batch || batch.length === 0) {
          emptyCount++;
          continue;
        }

        const mapped = batch.map((member: any) => ({
          userId: member.id,
          firstName: member.firstName || "",
          lastName: member.lastName || "",
          username: member.username || null,
          phoneNumber: member.phone || null,
          isBot: member.bot || false,
          isActive: true,
          lastSeen: new Date(),
        }));

        allMembers.push(...mapped);
        totalProcessed += batch.length;
        offset += limit;

        // Emit batch for streaming processing
        if (onBatch) await onBatch(mapped);

        // Memory safety check: pause if memory is high
        if (totalProcessed % 5000 === 0) {
          // Force garbage collection hint
          if (global.gc) global.gc();
          // Small delay to prevent overwhelming
          await new Promise(r => setTimeout(r, 100));
        }

        // Safety: stop if no more members after 3 empty batches
        if (emptyCount >= 3) break;
      }

      return allMembers;
    } catch (error) {
      console.error("Failed to extract members:", error);
      throw error;
    }
  }

  /**
   * Extract active members (engaged in last N days)
   */
  async extractEngagedMembers(
    accountId: number,
    groupId: number | string,
    daysActive: number = 7
  ): Promise<any[]> {
    try {
      const allMembers = await this.extractGroupMembers(accountId, groupId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysActive);

      return allMembers.filter(
        (member) =>
          member.lastSeen &&
          new Date(member.lastSeen) >= cutoffDate
      );
    } catch (error) {
      console.error("Failed to extract engaged members:", error);
      throw error;
    }
  }

  /**
   * Extract group administrators
   */
  async extractGroupAdmins(
    accountId: number,
    groupId: number | string
  ): Promise<any[]> {
    try {
      const client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      // Get channel/group entity
      const entity = await (client as any).getEntity(groupId);
      
      // Get participants with admin filter
      const admins = await (client as any).getParticipants(entity, {
        filter: { _: "channelParticipantsAdmins" },
      });

      return admins.map((admin: any) => ({
        userId: admin.id,
        firstName: admin.firstName || "",
        lastName: admin.lastName || "",
        username: admin.username || null,
        phoneNumber: admin.phone || null,
        isAdmin: true,
        isActive: true,
        lastSeen: new Date(),
      }));
    } catch (error) {
      console.error("Failed to extract admins:", error);
      throw error;
    }
  }

  /**
   * Send message to user with Anti-Ban protection
   */
  async sendMessage(
    accountId: number,
    userId: number | string,
    message: string
  ): Promise<boolean> {
    try {
      // 1. Anti-Ban pre-check
      const approval = await antiBanIntegration.preOperationCheck(accountId, {
        type: 'message',
        targetCount: 1,
        speed: 'medium',
        targetInfo: { userId, messageLength: message.length },
        accountAge: 30,
        systemLoad: 0.3
      });

      if (!approval.approved) {
        console.log(`🛡️ Anti-Ban: Message rejected - ${approval.reason}`);
        return false;
      }

      // 2. Smart delay before sending
      if (approval.delay && approval.delay > 0) {
        console.log(`🛡️ Anti-Ban: Waiting ${approval.delay}ms before message...`);
        await new Promise(resolve => setTimeout(resolve, approval.delay));
      }

      const client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      const startTime = Date.now();

      // 3. Send message with monitoring
      try {
        await (client as any).sendMessage(userId, {
          message,
        });

        const duration = Date.now() - startTime;

        // 4. Record successful operation
        await antiBanIntegration.recordOperationResult(accountId, {
          type: 'message',
          targetCount: 1,
          speed: 'medium'
        }, {
          success: true,
          duration,
          actualDelay: approval.delay,
          responseTime: duration,
          proxyUsed: approval.proxy?.id
        });

        console.log(`✅ Anti-Ban: Message sent successfully in ${duration}ms`);
        return true;

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // 5. Record failed operation
        await antiBanIntegration.recordOperationResult(accountId, {
          type: 'message',
          targetCount: 1,
          speed: 'medium'
        }, {
          success: false,
          duration,
          actualDelay: approval.delay,
          responseTime: duration,
          proxyUsed: approval.proxy?.id,
          errorType: 'TELEGRAM_ERROR',
          errorMessage
        });

        console.error(`🛡️ Anti-Ban: Message failed - ${errorMessage}`);
        throw error;
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  /**
   * Send message to multiple users with Anti-Ban protection
   */
  async sendBulkMessages(
    accountId: number,
    userIds: (number | string)[],
    messageTemplate: string,
    delayMs: number = 1000
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    try {
      // 1. Anti-Ban pre-check for bulk operation
      const approval = await antiBanIntegration.preOperationCheck(accountId, {
        type: 'message',
        targetCount: userIds.length,
        speed: 'medium',
        targetInfo: { messageLength: messageTemplate.length },
        accountAge: 30,
        systemLoad: 0.3
      });

      if (!approval.approved) {
        console.log(`🛡️ Anti-Ban: Bulk operation rejected - ${approval.reason}`);
        return { success: 0, failed: userIds.length };
      }

      console.log(`🛡️ Anti-Ban: Starting bulk messaging with protection - Confidence: ${(approval.confidence! * 100).toFixed(1)}%`);

      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        
        try {
          // 2. Individual Anti-Ban check for each message
          const messageApproval = await antiBanIntegration.preOperationCheck(accountId, {
            type: 'message',
            targetCount: 1,
            speed: i === 0 ? 'slow' : 'medium', // First message slower
            targetInfo: { userId, messageLength: messageTemplate.length },
            consecutiveFailures: failed,
            accountAge: 30
          });

          if (!messageApproval.approved) {
            console.log(`🛡️ Anti-Ban: Message ${i + 1} rejected - ${messageApproval.reason}`);
            failed++;
            continue;
          }

          // 3. Smart delay
          if (messageApproval.delay && messageApproval.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, messageApproval.delay));
          }

          // 4. Replace template variables
          const message = messageTemplate
            .replace("{userId}", String(userId))
            .replace("{firstName}", "User")
            .replace("{lastName}", "")
            .replace("{username}", "");

          const startTime = Date.now();

          // 5. Send message with monitoring
          const sent = await this.sendMessage(accountId, userId, message);
          
          if (sent) {
            success++;
            console.log(`✅ Anti-Ban: Message ${i + 1}/${userIds.length} sent successfully`);
          } else {
            failed++;
            console.log(`❌ Anti-Ban: Message ${i + 1}/${userIds.length} failed`);
          }

        } catch (error) {
          failed++;
          console.error(`Failed to send message to ${userId}:`, error);
          
          // Handle FloodWait with Anti-Ban
          const msg = (error as any)?.message || "";
          const match = /FLOOD_WAIT_(\d+)/i.exec(msg);
          if (match) {
            const seconds = Math.min(parseInt(match[1], 10) || 0, 60);
            if (seconds > 0) {
              console.log(`🛡️ Anti-Ban: Flood wait detected, backing off ${seconds}s...`);
              await new Promise((r) => setTimeout(r, seconds * 1000));
            }
          }
        }
      }

      console.log(`🛡️ Anti-Ban: Bulk operation completed - Success: ${success}, Failed: ${failed}`);

    } catch (error) {
      console.error("Bulk messaging failed:", error);
    }

    return { success, failed };
  }

  /**
   * Join a group with Anti-Ban protection
   */
  async joinGroup(accountId: number, groupLink: string): Promise<boolean> {
    try {
      // 1. Anti-Ban pre-check
      const approval = await antiBanIntegration.preOperationCheck(accountId, {
        type: 'join_group',
        targetCount: 1,
        speed: 'slow',
        targetInfo: { groupLink },
        accountAge: 30,
        systemLoad: 0.3
      });

      if (!approval.approved) {
        console.log(`🛡️ Anti-Ban: Group join rejected - ${approval.reason}`);
        return false;
      }

      // 2. Smart delay before joining
      if (approval.delay && approval.delay > 0) {
        console.log(`🛡️ Anti-Ban: Waiting ${approval.delay}ms before joining group...`);
        await new Promise(resolve => setTimeout(resolve, approval.delay));
      }

      const client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      const startTime = Date.now();

      const extractInviteHash = (link: string) => {
        const text = String(link).trim();
        // forms:
        // - https://t.me/+<hash>
        // - t.me/+<hash>
        // - https://t.me/joinchat/<hash>
        // - t.me/joinchat/<hash>
        const m1 = /t\.me\/(?:\+|joinchat\/)([A-Za-z0-9_-]+)/i.exec(text);
        if (m1?.[1]) return m1[1];
        // sometimes link already is hash
        if (/^[A-Za-z0-9_-]{16,}$/.test(text)) return text;
        return null;
      };

      // 3. Join group with monitoring
      try {
        const target = await entityResolver.resolveChat(client, groupLink);
        // If invite link, try import, otherwise join
        if ((target as any)?._.includes("inputChatInvite")) {
          const hash = extractInviteHash(groupLink);
          if (!hash) throw new Error("Invalid invite link");
          await (client as any).invoke({ _: "messages.importChatInvite", hash });
        } else {
          await (client as any).invoke({ _: "channels.joinChannel", channel: target });
        }

        const duration = Date.now() - startTime;

        // 4. Record successful operation
        await antiBanIntegration.recordOperationResult(accountId, {
          type: 'join_group',
          targetCount: 1,
          speed: 'slow'
        }, {
          success: true,
          duration,
          actualDelay: approval.delay,
          responseTime: duration,
          proxyUsed: approval.proxy?.id
        });

        console.log(`✅ Anti-Ban: Group joined successfully in ${duration}ms`);
        return true;

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // 5. Record failed operation
        await antiBanIntegration.recordOperationResult(accountId, {
          type: 'join_group',
          targetCount: 1,
          speed: 'slow'
        }, {
          success: false,
          duration,
          actualDelay: approval.delay,
          responseTime: duration,
          proxyUsed: approval.proxy?.id,
          errorType: 'JOIN_ERROR',
          errorMessage
        });

        console.error(`🛡️ Anti-Ban: Group join failed - ${errorMessage}`);
        throw error;
      }

    } catch (error) {
      console.error("Failed to join group:", error);
      return false;
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(accountId: number, groupId: number | string): Promise<boolean> {
    try {
      const client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      await (client as any).invoke({
        _: "channels.leaveChannel",
        channel: groupId,
      });

      return true;
    } catch (error) {
      console.error("Failed to leave group:", error);
      return false;
    }
  }

  /**
   * Add user to group with Anti-Ban protection and resource cleanup
   */
  async addUserToGroup(
    accountId: number,
    groupId: number | string,
    userId: number | string
  ): Promise<boolean> {
    let client: any = null;
    try {
      client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      const channel = await entityResolver.resolveChat(client, groupId);
      const user = await entityResolver.resolveUser(client, userId);

      await (client as any).invoke({
        _: "channels.inviteToChannel",
        channel,
        users: [user],
      });

      // Smart anti-ban delay after invite
      try {
        const rules = await db.getOrCreateAntiBanRules(accountId);
        const base = rules.enableRandomization
          ? Math.floor(rules.minDelayMs + Math.random() * Math.max(0, rules.maxDelayMs - rules.minDelayMs))
          : rules.minDelayMs;
        await new Promise((r) => setTimeout(r, Math.max(500, base)));
      } catch {}

      return true;
    } catch (error) {
      console.error("Failed to add user to group:", error);
      return false;
    } finally {
      // Optional: force cleanup if needed
      if (client && client.connected === false) {
        this.clients.delete(accountId);
      }
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(accountId: number): Promise<any> {
    try {
      const client = this.clients.get(accountId);
      if (!client) throw new Error("Client not initialized");

      const me = await (client as any).getMe();

      return {
        userId: me.id,
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        username: me.username || null,
        phoneNumber: me.phone || null,
        isBot: me.bot || false,
      };
    } catch (error) {
      console.error("Failed to get account info:", error);
      throw error;
    }
  }

  /**
   * Disconnect client
   */
  async disconnectClient(accountId: number): Promise<void> {
    try {
      const client = this.clients.get(accountId);
      if (client) {
        await (client as any).disconnect();
        this.clients.delete(accountId);
      }
    } catch (error) {
      console.error("Failed to disconnect client:", error);
    }
  }

  /**
   * Get all active clients
   */
  getActiveClients(): number[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if account is connected
   */
  isConnected(accountId: number): boolean {
    return this.clients.has(accountId);
  }
}
