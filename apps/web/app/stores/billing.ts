import { defineStore } from 'pinia';
import type { Plan, Subscription, Invoice, BillingState } from '~/types/stores';

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
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        const response = await requestFetch('/api/billing/plans');
        this.plans = response as Plan[];

        return {
          success: true,
          plans: this.plans,
        };
      } catch (error: unknown) {
        console.error('Fetch plans error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch plans',
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
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        const response = await requestFetch('/api/billing/subscriptions');
        this.subscriptions = response as Subscription[];

        // Set current active subscription
        const active = this.subscriptions.find((sub) => sub.status === 'active');
        this.currentSubscription = active || null;

        return {
          success: true,
          subscriptions: this.subscriptions,
        };
      } catch (error: unknown) {
        console.error('Fetch subscriptions error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch subscriptions',
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
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        const subscription = await requestFetch('/api/billing/subscriptions', {
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
      } catch (error: unknown) {
        console.error('Create subscription error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create subscription',
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
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        await requestFetch(`/api/billing/subscriptions/${externalId}`, {
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
      } catch (error: unknown) {
        console.error('Cancel subscription error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cancel subscription',
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
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        const response = await requestFetch('/api/billing/invoices');
        this.invoices = response as Invoice[];

        return {
          success: true,
          invoices: this.invoices,
        };
      } catch (error: unknown) {
        console.error('Fetch invoices error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch invoices',
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
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        const response = await requestFetch(`/api/billing/invoices/${invoiceId}/download`, {
          method: 'GET',
        });

        return {
          success: true,
          url: response,
        };
      } catch (error: unknown) {
        console.error('Download invoice error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to download invoice',
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
  } as any,
});
