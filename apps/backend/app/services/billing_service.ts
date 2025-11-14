import env from '#start/env';

/**
 * Lago API Types
 */
interface LagoCustomer {
  external_id: string;
  name?: string;
  email: string;
  currency?: string;
  timezone?: string;
  billing_configuration?: {
    payment_provider?: string;
    provider_customer_id?: string;
  };
  metadata?: Record<string, any>;
}

interface LagoPlan {
  code: string;
  name: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  amount_cents: number;
  amount_currency: string;
  description?: string;
}

interface LagoSubscription {
  external_customer_id: string;
  plan_code: string;
  name?: string;
  external_id?: string;
  billing_time?: 'calendar' | 'anniversary';
  ending_at?: string;
  subscription_at?: string;
}

interface LagoInvoice {
  lago_id: string;
  sequential_id: number;
  number: string;
  issuing_date: string;
  payment_status: string;
  amount_cents: number;
  currency: string;
  customer: any;
}

/**
 * Billing Service using Lago API
 *
 * Lago is an open-source billing platform that provides:
 * - Subscription management
 * - Usage-based billing
 * - Multi-gateway support (Stripe, PayPal, Adyen, etc.)
 * - Invoice generation
 * - Tax handling
 */
class BillingService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = env.get('LAGO_API_URL');
    this.apiKey = env.get('LAGO_API_KEY') || '';
  }

  /**
   * Make a request to Lago API
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.apiUrl}/api/v1${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add API key if available
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 404 gracefully
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lago API error: ${response.status} - ${errorText}`);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Lago API request failed:', error);
      throw error;
    }
  }

  /**
   * CUSTOMER MANAGEMENT
   */

  /**
   * Create a new customer in Lago
   */
  async createCustomer(customer: {
    externalId: string;
    name?: string;
    email: string;
    currency?: string;
    timezone?: string;
    billingConfiguration?: {
      paymentProvider?: string;
      providerCustomerId?: string;
    };
  }) {
    const payload: { customer: LagoCustomer } = {
      customer: {
        external_id: customer.externalId,
        name: customer.name,
        email: customer.email,
        currency: customer.currency || 'USD',
        timezone: customer.timezone || 'UTC',
      },
    };

    if (customer.billingConfiguration) {
      payload.customer.billing_configuration = {
        payment_provider: customer.billingConfiguration.paymentProvider,
        provider_customer_id: customer.billingConfiguration.providerCustomerId,
      };
    }

    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get customer by external ID
   */
  async getCustomer(externalId: string) {
    return this.request(`/customers/${externalId}`);
  }

  /**
   * Update customer
   */
  async updateCustomer(externalId: string, updates: Partial<LagoCustomer>) {
    return this.request(`/customers/${externalId}`, {
      method: 'PUT',
      body: JSON.stringify({ customer: updates }),
    });
  }

  /**
   * Delete customer
   */
  async deleteCustomer(externalId: string) {
    return this.request(`/customers/${externalId}`, {
      method: 'DELETE',
    });
  }

  /**
   * SUBSCRIPTION MANAGEMENT
   */

  /**
   * Create a subscription
   */
  async createSubscription(subscription: {
    externalCustomerId: string;
    planCode: string;
    externalId?: string;
    name?: string;
    billingTime?: 'calendar' | 'anniversary';
    endingAt?: string;
    subscriptionAt?: string;
  }) {
    const payload: { subscription: LagoSubscription } = {
      subscription: {
        external_customer_id: subscription.externalCustomerId,
        plan_code: subscription.planCode,
        external_id: subscription.externalId,
        name: subscription.name,
        billing_time: subscription.billingTime,
        ending_at: subscription.endingAt,
        subscription_at: subscription.subscriptionAt,
      },
    };

    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get subscription by external ID
   */
  async getSubscription(externalId: string) {
    return this.request(`/subscriptions/${externalId}`);
  }

  /**
   * List all subscriptions for a customer
   */
  async getCustomerSubscriptions(externalCustomerId: string) {
    return this.request(`/subscriptions?external_customer_id=${externalCustomerId}`);
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    externalId: string,
    updates: {
      name?: string;
      endingAt?: string;
      subscriptionAt?: string;
    }
  ) {
    return this.request(`/subscriptions/${externalId}`, {
      method: 'PUT',
      body: JSON.stringify({ subscription: updates }),
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(externalId: string) {
    return this.request(`/subscriptions/${externalId}`, {
      method: 'DELETE',
    });
  }

  /**
   * PLAN MANAGEMENT
   */

  /**
   * Create a plan
   */
  async createPlan(plan: {
    code: string;
    name: string;
    interval: 'monthly' | 'yearly' | 'weekly';
    amountCents: number;
    amountCurrency: string;
    description?: string;
    charges?: any[];
  }) {
    const payload: { plan: LagoPlan } = {
      plan: {
        code: plan.code,
        name: plan.name,
        interval: plan.interval,
        amount_cents: plan.amountCents,
        amount_currency: plan.amountCurrency,
        description: plan.description,
      },
    };

    return this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get plan by code
   */
  async getPlan(code: string) {
    return this.request(`/plans/${code}`);
  }

  /**
   * List all plans
   */
  async getPlans(page: number = 1, perPage: number = 20) {
    return this.request(`/plans?page=${page}&per_page=${perPage}`);
  }

  /**
   * Update plan
   */
  async updatePlan(code: string, updates: Partial<LagoPlan>) {
    return this.request(`/plans/${code}`, {
      method: 'PUT',
      body: JSON.stringify({ plan: updates }),
    });
  }

  /**
   * Delete plan
   */
  async deletePlan(code: string) {
    return this.request(`/plans/${code}`, {
      method: 'DELETE',
    });
  }

  /**
   * INVOICE MANAGEMENT
   */

  /**
   * List invoices for a customer
   */
  async getInvoices(externalCustomerId: string, page: number = 1) {
    return this.request(`/invoices?external_customer_id=${externalCustomerId}&page=${page}`);
  }

  /**
   * Get invoice by Lago ID
   */
  async getInvoice(lagoId: string) {
    return this.request(`/invoices/${lagoId}`);
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(lagoId: string) {
    return this.request(`/invoices/${lagoId}/download`, {
      method: 'POST',
    });
  }

  /**
   * Finalize invoice (draft → finalized)
   */
  async finalizeInvoice(lagoId: string) {
    return this.request(`/invoices/${lagoId}/finalize`, {
      method: 'PUT',
    });
  }

  /**
   * Retry invoice payment
   */
  async retryInvoice(lagoId: string) {
    return this.request(`/invoices/${lagoId}/retry_payment`, {
      method: 'POST',
    });
  }

  /**
   * USAGE & EVENTS (for usage-based billing)
   */

  /**
   * Send usage event
   */
  async sendEvent(event: {
    transactionId: string;
    externalCustomerId: string;
    code: string; // billable metric code
    timestamp?: number;
    properties?: Record<string, any>;
  }) {
    const payload = {
      event: {
        transaction_id: event.transactionId,
        external_customer_id: event.externalCustomerId,
        code: event.code,
        timestamp: event.timestamp || Math.floor(Date.now() / 1000),
        properties: event.properties || {},
      },
    };

    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Batch send events
   */
  async sendBatchEvents(events: any[]) {
    return this.request('/events/batch', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }

  /**
   * COMPATIBILITY METHODS
   * (to match previous Lago / Vendure interface)
   */

  /**
   * Create account (maps to createCustomer)
   */
  async createAccount(account: { id?: string; name: string; email: string; currency?: string }) {
    return this.createCustomer({
      externalId: account.id || `cust_${Date.now()}`,
      name: account.name,
      email: account.email,
      currency: account.currency,
    });
  }

  /**
   * Get account (maps to getCustomer)
   */
  async getAccount(accountId: string) {
    return this.getCustomer(accountId);
  }

  /**
   * Get account by email (Lago doesn't support email lookup directly)
   */
  async getAccountByEmail(email: string) {
    // Note: Lago API doesn't support email-based lookup
    // You'll need to maintain your own mapping in your database
    console.warn(
      'getAccountByEmail not directly supported by Lago - maintain email->externalId mapping in your DB'
    );
    return null;
  }

  /**
   * Get subscriptions (maps to getCustomerSubscriptions)
   */
  async getSubscriptions(customerId: string) {
    return this.getCustomerSubscriptions(customerId);
  }

  /**
   * Get catalog (maps to getPlans)
   */
  async getCatalog() {
    const result = await this.getPlans();
    return {
      products: result?.plans || [],
    };
  }

  /**
   * PAYMENT PROVIDER INTEGRATION
   */

  /**
   * Create Stripe customer and link to Lago
   */
  async linkStripeCustomer(externalCustomerId: string, stripeCustomerId: string) {
    return this.updateCustomer(externalCustomerId, {
      billing_configuration: {
        payment_provider: 'stripe',
        provider_customer_id: stripeCustomerId,
      },
    } as any);
  }

  /**
   * Create PayPal customer and link to Lago
   */
  async linkPayPalCustomer(externalCustomerId: string, paypalCustomerId: string) {
    return this.updateCustomer(externalCustomerId, {
      billing_configuration: {
        payment_provider: 'paypal',
        provider_customer_id: paypalCustomerId,
      },
    } as any);
  }

  /**
   * Get payment provider status for customer
   */
  async getPaymentProvider(externalCustomerId: string) {
    const customer = await this.getCustomer(externalCustomerId);
    return customer?.customer?.billing_configuration;
  }
}

// Singleton instance
export default new BillingService();
