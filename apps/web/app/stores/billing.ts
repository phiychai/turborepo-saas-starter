import { defineStore } from 'pinia';

export interface Plan {
  code: string;
  name: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  amount_cents: number;
  amount_currency: string;
  description?: string;
}

export interface Subscription {
  external_id: string;
  plan_code: string;
  status: string;
  name?: string;
  created_at: string;
  started_at?: string;
  ending_at?: string;
}

export interface Invoice {
  lago_id: string;
  number: string;
  issuing_date: string;
  payment_status: string;
  amount_cents: number;
  currency: string;
  file_url?: string;
}

export interface BillingState {
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  currentSubscription: Subscription | null;
  loading: boolean;
  plansLoading: boolean;
  subscriptionsLoading: boolean;
  invoicesLoading: boolean;
}

export const useBillingStore = defineStore('billing', {
  state: (): BillingState => ({
    plans: [],
    subscriptions: [],
    invoices: [],
    currentSubscription: null,
    loading: false,
    plansLoading: false,
    subscriptionsLoading: false,
    invoicesLoading: false,
  }),

  getters: {
    availablePlans: (state) => state.plans,
    activeSubscription: (state) => state.currentSubscription,
    hasActiveSubscription: (state) => !!state.currentSubscription,
    recentInvoices: (state) => state.invoices.slice(0, 5),
    isLoading: (state) => state.loading,
  },

  actions: {
    /**
     * Fetch available plans
     */
    async fetchPlans() {
      this.plansLoading = true;

      try {
        const { $fetch } = useNuxtApp();

        const response = await $fetch('/api/billing/plans');
        this.plans = response as Plan[];

        return {
          success: true,
          plans: this.plans,
        };
      } catch (error: any) {
        console.error('Fetch plans error:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch plans',
        };
      } finally {
        this.plansLoading = false;
      }
    },

    /**
     * Fetch user subscriptions
     */
    async fetchSubscriptions() {
      this.subscriptionsLoading = true;

      try {
        const { $fetch } = useNuxtApp();

        const response = await $fetch('/api/billing/subscriptions');
        this.subscriptions = response as Subscription[];

        // Set current active subscription
        const active = this.subscriptions.find((sub) => sub.status === 'active');
        this.currentSubscription = active || null;

        return {
          success: true,
          subscriptions: this.subscriptions,
        };
      } catch (error: any) {
        console.error('Fetch subscriptions error:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch subscriptions',
        };
      } finally {
        this.subscriptionsLoading = false;
      }
    },

    /**
     * Create a new subscription
     */
    async createSubscription(planCode: string) {
      this.loading = true;

      try {
        const { $fetch } = useNuxtApp();

        const subscription = await $fetch('/api/billing/subscriptions', {
          method: 'POST',
          body: {
            planCode,
            externalId: `sub_${Date.now()}`,
          },
        });

        this.subscriptions.push(subscription as Subscription);
        this.currentSubscription = subscription as Subscription;

        return {
          success: true,
          subscription,
        };
      } catch (error: any) {
        console.error('Create subscription error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create subscription',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Cancel subscription
     */
    async cancelSubscription(externalId: string) {
      this.loading = true;

      try {
        const { $fetch } = useNuxtApp();

        await $fetch(`/api/billing/subscriptions/${externalId}`, {
          method: 'DELETE',
        });

        // Remove from local state
        const index = this.subscriptions.findIndex((sub) => sub.external_id === externalId);
        if (index !== -1) {
          this.subscriptions.splice(index, 1);
        }

        // Clear current if it was the active one
        if (this.currentSubscription?.external_id === externalId) {
          this.currentSubscription = null;
        }

        return { success: true };
      } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return {
          success: false,
          error: error.message || 'Failed to cancel subscription',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch user invoices
     */
    async fetchInvoices() {
      this.invoicesLoading = true;

      try {
        const { $fetch } = useNuxtApp();

        const response = await $fetch('/api/billing/invoices');
        this.invoices = response as Invoice[];

        return {
          success: true,
          invoices: this.invoices,
        };
      } catch (error: any) {
        console.error('Fetch invoices error:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch invoices',
        };
      } finally {
        this.invoicesLoading = false;
      }
    },

    /**
     * Download invoice
     */
    async downloadInvoice(invoiceId: string) {
      try {
        const { $fetch } = useNuxtApp();

        const response = await $fetch(`/api/billing/invoices/${invoiceId}/download`, {
          method: 'GET',
        });

        return {
          success: true,
          url: response,
        };
      } catch (error: any) {
        console.error('Download invoice error:', error);
        return {
          success: false,
          error: error.message || 'Failed to download invoice',
        };
      }
    },

    /**
     * Clear billing data (for logout)
     */
    clearBillingData() {
      this.plans = [];
      this.subscriptions = [];
      this.invoices = [];
      this.currentSubscription = null;
    },
  },

  // Optionally persist current subscription
  persist: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['currentSubscription'],
  },
});
