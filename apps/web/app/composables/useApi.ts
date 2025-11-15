export const useApi = () => {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl || 'http://localhost:3333';

  /**
   * Make an API request
   */
  const request = async <T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: any;
      query?: Record<string, any>;
    } = {}
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      const data = await $fetch<T>(`${apiUrl}${endpoint}`, {
        method: options.method || 'GET',
        body: options.body,
        query: options.query,
        credentials: 'include',
      });

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: error.data?.message || error.message || 'Request failed',
      };
    }
  };

  /**
   * CMS API methods
   */
  const cms = {
    getCollection: async (collection: string, params?: Record<string, any>) =>
      request(`/api/cms/collections/${collection}`, {
        method: 'GET',
        query: params,
      }),

    getItem: async (collection: string, id: string | number, params?: Record<string, any>) =>
      request(`/api/cms/collections/${collection}/${id}`, {
        method: 'GET',
        query: params,
      }),

    createItem: async (collection: string, data: Record<string, any>) =>
      request(`/api/cms/${collection}`, {
        method: 'POST',
        body: data,
      }),

    updateItem: async (collection: string, id: string | number, data: Record<string, any>) =>
      request(`/api/cms/${collection}/${id}`, {
        method: 'PATCH',
        body: data,
      }),

    deleteItem: async (collection: string, id: string | number) =>
      request(`/api/cms/${collection}/${id}`, {
        method: 'DELETE',
      }),
  };

  /**
   * Billing API methods
   */
  const billing = {
    getAccount: async () => request('/api/billing/account'),

    getSubscriptions: async () => request('/api/billing/subscriptions'),

    createSubscription: async (planName: string, externalKey?: string) =>
      request('/api/billing/subscriptions', {
        method: 'POST',
        body: { planName, externalKey },
      }),

    cancelSubscription: async (subscriptionId: string, requestedDate?: string) =>
      request(`/api/billing/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        query: requestedDate ? { requestedDate } : undefined,
      }),

    getInvoices: async () => request('/api/billing/invoices'),

    getPlans: async () => request('/api/billing/plans'),

    getPaymentMethods: async () => request('/api/billing/payment-methods'),

    addPaymentMethod: async (pluginName: string, pluginInfo: Record<string, any>) =>
      request('/api/billing/payment-methods', {
        method: 'POST',
        body: { pluginName, pluginInfo },
      }),
  };

  /**
   * User API methods
   */
  const users = {
    getAll: async () => request('/api/user/users'),

    toggleStatus: async (userId: number) =>
      request(`/api/user/users/${userId}/toggle-status`, {
        method: 'PATCH',
      }),
  };

  return {
    request,
    cms,
    billing,
    users,
  };
};
