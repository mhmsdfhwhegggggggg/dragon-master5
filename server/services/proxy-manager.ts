import * as db from "../db";

type ProxyType = "socks5" | "http";

export type ProxyConfig = {
  id?: number;
  accountId: number;
  host: string;
  port: number;
  type: ProxyType;
  username?: string | null;
  password?: string | null;
  health?: "healthy" | "unhealthy" | "unknown";
  lastCheckedAt?: Date | null;
};

class ProxyManager {
  private rrIndex: Map<number, number> = new Map(); // round-robin per account
  private cache: Map<number, ProxyConfig[]> = new Map();
  private lastLoadAt: Map<number, number> = new Map();

  private shouldReload(accountId: number) {
    const last = this.lastLoadAt.get(accountId) || 0;
    return Date.now() - last > 30_000; // refresh every 30s
  }

  private async loadProxies(accountId: number) {
    if (!this.shouldReload(accountId) && this.cache.has(accountId)) return this.cache.get(accountId)!;
    const rows = await db.getProxyConfigsByAccountId(accountId);
    const list: ProxyConfig[] = rows.map((r: any) => ({
      id: r.id,
      accountId: r.accountId,
      host: r.host,
      port: r.port,
      type: r.type,
      username: r.username,
      password: r.password,
      health: r.health ?? "unknown",
      lastCheckedAt: r.lastCheckedAt ? new Date(r.lastCheckedAt) : null,
    }));
    // Prefer healthy first
    list.sort((a, b) => (a.health === "healthy" ? -1 : 1));
    this.cache.set(accountId, list);
    this.lastLoadAt.set(accountId, Date.now());
    if (!this.rrIndex.has(accountId)) this.rrIndex.set(accountId, 0);
    return list;
  }

  async getProxyForAccount(accountId: number): Promise<ProxyConfig | null> {
    const proxies = await this.loadProxies(accountId);
    if (!proxies.length) return null;
    // Round robin across proxies, prioritizing healthy sorted first
    const idx = this.rrIndex.get(accountId) || 0;
    const proxy = proxies[idx % proxies.length];
    this.rrIndex.set(accountId, (idx + 1) % proxies.length);
    return proxy;
  }

  async reportSuccess(accountId: number, proxy: ProxyConfig) {
    try {
      // Optimistic in-memory mark
      const list = this.cache.get(accountId) || [];
      const it = list.find((p) => p.host === proxy.host && p.port === proxy.port);
      if (it) it.health = "healthy";
      // Persist best-effort
      // You may extend db.ts with an update function; for now, ignore if missing.
    } catch {}
  }

  async reportFailure(accountId: number, proxy: ProxyConfig) {
    try {
      const list = this.cache.get(accountId) || [];
      const it = list.find((p) => p.host === proxy.host && p.port === proxy.port);
      if (it) it.health = "unhealthy";
    } catch {}
  }
}

export const proxyManager = new ProxyManager();
