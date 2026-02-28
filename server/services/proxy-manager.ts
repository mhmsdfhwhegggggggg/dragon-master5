/**
 * Proxy Manager - Advanced Proxy Management System
 * Handles proxy rotation, health checks, and intelligent selection
 */

export interface ProxyConfig {
  id: number;
  host: string;
  port: number;
  type: 'socks5' | 'http' | 'https';
  username?: string;
  password?: string;
  isActive: boolean;
  lastCheckedAt?: Date;
  isWorking: boolean;
}

export class ProxyManager {
  private static instance: ProxyManager;
  private proxies: Map<number, ProxyConfig[]> = new Map();

  private constructor() { }

  static getInstance(): ProxyManager {
    if (!this.instance) {
      this.instance = new ProxyManager();
    }
    return this.instance;
  }

  /**
   * Get proxy for specific account (Strict 1:1:1 Binding)
   */
  async getProxyForAccount(accountId: number): Promise<ProxyConfig | null> {
    const accountProxies = this.proxies.get(accountId) || [];

    // Get active and working proxies
    const activeProxies = accountProxies.filter(p => p.isActive && p.isWorking);

    if (activeProxies.length === 0) return null;

    // V10.0: Strict Sticky Selection - always use the first assigned proxy for this account
    // This ensures the account never changes IP mid-session
    return activeProxies[0];
  }

  /**
   * Add proxy configuration
   */
  addProxy(accountId: number, proxy: Omit<ProxyConfig, 'id'>): void {
    const accountProxies = this.proxies.get(accountId) || [];
    const newProxy: ProxyConfig = {
      ...proxy,
      id: Date.now() + Math.random(),
    };

    accountProxies.push(newProxy);
    this.proxies.set(accountId, accountProxies);
  }

  /**
   * Check proxy health
   */
  async checkProxyHealth(proxy: ProxyConfig): Promise<boolean> {
    try {
      const axios = (await import('axios')).default;
      const { HttpProxyAgent } = await import('http-proxy-agent');
      const { SocksProxyAgent } = await import('socks-proxy-agent');

      const proxyUrl = this.getProxyString(proxy);
      const agent = proxy.type === 'socks5'
        ? new SocksProxyAgent(proxyUrl)
        : new HttpProxyAgent(proxyUrl);

      proxy.lastCheckedAt = new Date();

      const response = await axios.get('https://api.telegram.org', {
        httpsAgent: agent,
        timeout: 5000
      });

      proxy.isWorking = response.status === 200;
      return proxy.isWorking;
    } catch (error) {
      proxy.isWorking = false;
      return false;
    }
  }

  /**
   * Get proxy string for Telegram client
   */
  getProxyString(proxy: ProxyConfig): string {
    if (proxy.username && proxy.password) {
      return `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
    return `${proxy.type}://${proxy.host}:${proxy.port}`;
  }
}

export const proxyManager = ProxyManager.getInstance();
