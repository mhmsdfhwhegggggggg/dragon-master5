/**
 * Telegram Client Service - Core Telegram Operations
 * Manages Telegram client connections and operations with anti-ban integration
 */

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as db from "../db";
import { Secrets } from "../_core/secrets";
import { entityResolver } from "./entity-resolver";

export class TelegramClientService {
  private static clients: Map<number, TelegramClient> = new Map();

  /**
   * Get API credentials from environment or secrets
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
   * Initialize Telegram client
   */
  async initializeClient(
    accountId: number,
    phoneNumber: string,
    sessionString: string,
    apiId?: number,
    apiHash?: string
  ): Promise<TelegramClient> {
    const credentials = apiId && apiHash ? { apiId, apiHash } : this.getApiCredentials();

    const session = new StringSession(sessionString);
    const client = new TelegramClient(session, credentials.apiId, credentials.apiHash, {
      connectionRetries: 5,
      retryDelay: 2000,
    });

    await client.connect();
    
    // Store client for reuse
    TelegramClientService.clients.set(accountId, client);
    
    return client;
  }

  /**
   * Disconnect client
   */
  async disconnectClient(accountId: number): Promise<void> {
    const client = TelegramClientService.clients.get(accountId);
    if (client) {
      await client.disconnect();
      TelegramClientService.clients.delete(accountId);
    }
  }

  /**
   * Get existing client
   */
  getClient(accountId: number): TelegramClient | undefined {
    return TelegramClientService.clients.get(accountId);
  }

  /**
   * Extract group members with streaming
   */
  async extractGroupMembers(accountId: number, groupId: string): Promise<any[]> {
    const client = this.getClient(accountId);
    if (!client) throw new Error("Client not initialized");

    const entity = await entityResolver.resolveEntity(client, groupId);
    const members = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      try {
        const result = await client.invoke({
          _: 'channels.getParticipants',
          channel: entity,
          filter: { _: 'channelParticipantsRecent' },
          offset,
          limit,
          hash: BigInt(0)
        });

        if (!result || !(result as any).participants || (result as any).participants.length === 0) break;
        
        members.push(...(result as any).participants);
        offset += limit;

        // Smart delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Extraction error:', error);
        break;
      }
    }

    return members;
  }

  /**
   * Send message
   */
  async sendMessage(accountId: number, targetId: string, message: string): Promise<boolean> {
    const client = this.getClient(accountId);
    if (!client) throw new Error("Client not initialized");

    try {
      await client.sendMessage(targetId, { message });
      return true;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }
}
