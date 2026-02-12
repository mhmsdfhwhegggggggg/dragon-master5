import { TelegramClient } from "telegram";

export class EntityResolver {
  async resolveChat(client: TelegramClient, input: string | number): Promise<any> {
    try {
      // If numeric, use directly
      if (typeof input === "number" || /^\d+$/.test(String(input))) {
        return await (client as any).getEntity(Number(input));
      }
      const text = String(input).trim();
      // Invite links or usernames
      if (text.startsWith("https://t.me/") || text.startsWith("t.me/")) {
        const slug = text.replace(/^https?:\/\/t\.me\//i, "");
        // If it's a joinchat link, attempt import
        if (/^\+/.test(slug) || /joinchat\//i.test(text)) {
          return { _: "inputChatInvite", link: text };
        }
        return await (client as any).getEntity(slug);
      }
      // username form
      if (/^@/.test(text)) {
        return await (client as any).getEntity(text.slice(1));
      }
      // fallback to raw
      return await (client as any).getEntity(text);
    } catch (e) {
      return input;
    }
  }

  async resolveUser(client: TelegramClient, input: string | number): Promise<any> {
    try {
      if (typeof input === "number" || /^\d+$/.test(String(input))) {
        return await (client as any).getEntity(Number(input));
      }
      const text = String(input).trim();
      if (/^@/.test(text)) return await (client as any).getEntity(text.slice(1));
      return await (client as any).getEntity(text);
    } catch {
      return input;
    }
  }
}

export const entityResolver = new EntityResolver();
