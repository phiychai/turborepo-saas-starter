import {
  createDirectus,
  rest,
  authentication,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
} from '@directus/sdk';

import env from '#start/env';

class DirectusService {
  private client: any;
  private adminToken: string | null = null;

  constructor() {
    this.client = createDirectus(env.get('DIRECTUS_URL')).with(rest()).with(authentication());
  }

  /**
   * Authenticate with Directus using admin credentials
   */
  async authenticate() {
    try {
      // Use static token if available
      const staticTokenValue = env.get('DIRECTUS_STATIC_TOKEN');
      if (staticTokenValue) {
        this.adminToken = staticTokenValue;
        return this.adminToken;
      }

      // Otherwise, authenticate with email/password
      const email = env.get('DIRECTUS_ADMIN_EMAIL');
      const password = env.get('DIRECTUS_ADMIN_PASSWORD');

      await this.client.login(email, password);
      this.adminToken = this.client.getToken();

      return this.adminToken;
    } catch (error) {
      console.error('Failed to authenticate with Directus:', error);
      throw new Error('Directus authentication failed');
    }
  }

  /**
   * Get the authenticated client
   */
  async getClient() {
    if (!this.adminToken) {
      await this.authenticate();
    }
    return this.client;
  }

  /**
   * Proxy a request to Directus
   */
  async proxyRequest(path: string, method: string, body?: any, headers?: Record<string, string>) {
    const directusUrl = env.get('DIRECTUS_URL');
    const url = `${directusUrl}${path}`;

    const token = await this.getToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      console.error('Directus proxy request failed:', error);
      throw error;
    }
  }

  /**
   * Get the current auth token
   */
  async getToken() {
    if (!this.adminToken) {
      await this.authenticate();
    }
    return this.adminToken;
  }

  /**
   * Get items from a collection
   */
  async getItems(collection: string, params?: Record<string, any>) {
    const client = await this.getClient();
    return client.request(readItems(collection as never, params));
  }

  /**
   * Get a single item from a collection
   */
  async getItem(collection: string, id: string | number, params?: Record<string, any>) {
    const client = await this.getClient();
    return client.request(readItem(collection as never, id, params));
  }

  /**
   * Create an item in a collection
   */
  async createItem(collection: string, data: Record<string, any>) {
    const client = await this.getClient();
    return client.request(createItem(collection as never, data as never));
  }

  /**
   * Update an item in a collection
   */
  async updateItem(collection: string, id: string | number, data: Record<string, any>) {
    const client = await this.getClient();
    return client.request(updateItem(collection as never, id, data));
  }

  /**
   * Delete an item from a collection
   */
  async deleteItem(collection: string, id: string | number) {
    const client = await this.getClient();
    return client.request(deleteItem(collection as never, id));
  }
}

// Singleton instance
export default new DirectusService();
