import type { HttpContext } from "@adonisjs/core/http";
import billingService from "#services/billing_service";

export default class BillingController {
  /**
   * Get or create Lago account for the current user
   */
  async getOrCreateAccount({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      // Try to get existing account
      let account;
      try {
        account = await billingService.getAccountByEmail(user.email);
      } catch {
        // Account doesn't exist, create it
        account = await billingService.createAccount({
          name: user.fullName || user.email,
          email: user.email,
          currency: "USD",
        });
      }

      return response.ok({
        account,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to get or create billing account",
        error: error.message,
      });
    }
  }

  /**
   * Get user's subscriptions
   */
  async getSubscriptions({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      // Get the Lago account
      const account = await billingService.getAccountByEmail(user.email);

      if (!account || !account.accountId) {
        return response.ok({
          subscriptions: [],
        });
      }

      const subscriptions = await billingService.getSubscriptions(account.accountId);

      return response.ok({
        subscriptions,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to fetch subscriptions",
        error: error.message,
      });
    }
  }

  /**
   * Create a new subscription
   */
  async createSubscription({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!;
      const { planName, externalKey } = request.body();

      if (!planName) {
        return response.badRequest({
          message: "Plan name is required",
        });
      }

      // Get or create account
      let account;
      try {
        account = await billingService.getAccountByEmail(user.email);
      } catch {
        account = await billingService.createAccount({
          name: user.fullName || user.email,
          email: user.email,
          currency: "USD",
        });
      }

      const subscription = await billingService.createSubscription({
        accountId: account.accountId,
        planName,
        externalKey,
      });

      return response.created({
        message: "Subscription created successfully",
        subscription,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to create subscription",
        error: error.message,
      });
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription({ params, request, response, auth }: HttpContext) {
    try {
      await auth.check();
      const subscriptionId = params.id;
      const { requestedDate } = request.qs();

      await billingService.cancelSubscription(subscriptionId, requestedDate);

      return response.ok({
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to cancel subscription",
        error: error.message,
      });
    }
  }

  /**
   * Get user's invoices
   */
  async getInvoices({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      const account = await billingService.getAccountByEmail(user.email);

      if (!account || !account.accountId) {
        return response.ok({
          invoices: [],
        });
      }

      const invoices = await billingService.getInvoices(account.accountId);

      return response.ok({
        invoices,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to fetch invoices",
        error: error.message,
      });
    }
  }

  /**
   * Get available plans
   */
  async getPlans({ response }: HttpContext) {
    try {
      const plans = await billingService.getPlans();

      return response.ok({
        plans,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to fetch plans",
        error: error.message,
      });
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!;
      const { pluginName, pluginInfo } = request.body();

      if (!pluginName || !pluginInfo) {
        return response.badRequest({
          message: "Plugin name and info are required",
        });
      }

      const account = await billingService.getAccountByEmail(user.email);

      const paymentMethod = await billingService.addPaymentMethod({
        accountId: account.accountId,
        pluginName,
        pluginInfo,
      });

      return response.created({
        message: "Payment method added successfully",
        paymentMethod,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to add payment method",
        error: error.message,
      });
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      const account = await billingService.getAccountByEmail(user.email);

      if (!account || !account.accountId) {
        return response.ok({
          paymentMethods: [],
        });
      }

      const paymentMethods = await billingService.getPaymentMethods(account.accountId);

      return response.ok({
        paymentMethods,
      });
    } catch (error) {
      return response.internalServerError({
        message: "Failed to fetch payment methods",
        error: error.message,
      });
    }
  }
}
