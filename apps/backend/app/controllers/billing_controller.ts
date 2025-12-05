import type { LagoAccountResponse } from '#types/billing';
import type { HttpContext } from '@adonisjs/core/http';

import billingService from '#services/billing_service';

export default class BillingController {
  /**
   * @getOrCreateAccount
   * @summary Get or create billing account
   * @description Retrieves the current user's Lago billing account, or creates one if it doesn't exist. The account is linked to the user's email address.
   * @tag Billing
   * @response 200 - Account retrieved or created successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 500 - Server error - Failed to get or create account
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
          currency: 'USD',
        });
      }

      return response.ok({
        account,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to get or create billing account',
        error: error.message,
      });
    }
  }

  /**
   * @getSubscriptions
   * @summary Get user's subscriptions
   * @description Retrieves all active and past subscriptions for the current user's billing account.
   * @tag Billing
   * @response 200 - Subscriptions retrieved successfully (may be empty array)
   * @response 401 - Unauthorized - Authentication required
   * @response 500 - Server error - Failed to fetch subscriptions
   */
  async getSubscriptions({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      // Get the Lago account
      const account = await billingService.getAccountByEmail(user.email);

      if (!account) {
        return response.ok({ subscriptions: [] });
      }
      const accountResponse = account as LagoAccountResponse;
      if (!accountResponse.customer?.external_id) {
        return response.ok({
          subscriptions: [],
        });
      }

      const subscriptions = await billingService.getSubscriptions(
        accountResponse.customer.external_id
      );

      return response.ok({
        subscriptions,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch subscriptions',
        error: error.message,
      });
    }
  }

  /**
   * @createSubscription
   * @summary Create a new subscription
   * @description Creates a new subscription for the current user to a billing plan. The user's billing account will be created if it doesn't exist.
   * @tag Billing
   * @requestBody {object} body - Subscription creation data
   * @requestBody {string} body.planName - Plan code/name to subscribe to (required)
   * @requestBody {string} body.externalKey - External identifier for the subscription (optional)
   * @response 201 - Subscription created successfully
   * @response 400 - Bad request - Plan name is required or customer external ID not found
   * @response 401 - Unauthorized - Authentication required
   * @response 500 - Server error - Failed to create subscription
   */
  async createSubscription({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!;
      const { planName, externalKey } = request.body();

      if (!planName) {
        return response.badRequest({
          message: 'Plan name is required',
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
          currency: 'USD',
        });
      }

      const accountResponse = account as LagoAccountResponse;
      const accountExternalId =
        accountResponse?.customer?.external_id || accountResponse?.external_id;
      if (!accountExternalId) {
        return response.badRequest({ error: 'Customer external ID not found' });
      }
      const subscription = await billingService.createSubscription({
        externalCustomerId: accountExternalId,
        planCode: planName,
        externalId: externalKey,
      });

      return response.created({
        message: 'Subscription created successfully',
        subscription,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create subscription',
        error: error.message,
      });
    }
  }

  /**
   * @cancelSubscription
   * @summary Cancel a subscription
   * @description Cancels an active subscription by its ID. The subscription will be terminated according to the billing provider's cancellation policy.
   * @tag Billing
   * @paramPath {string} id - Subscription ID (required)
   * @response 200 - Subscription cancelled successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 404 - Subscription not found
   * @response 500 - Server error - Failed to cancel subscription
   */
  async cancelSubscription({ params, response, auth }: HttpContext) {
    try {
      await auth.check();
      const subscriptionId = params.id;

      await billingService.cancelSubscription(subscriptionId);

      return response.ok({
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to cancel subscription',
        error: error.message,
      });
    }
  }

  /**
   * @getInvoices
   * @summary Get user's invoices
   * @description Retrieves all invoices for the current user's billing account, including paid and unpaid invoices.
   * @tag Billing
   * @response 200 - Invoices retrieved successfully (may be empty array)
   * @response 401 - Unauthorized - Authentication required
   * @response 500 - Server error - Failed to fetch invoices
   */
  async getInvoices({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      const account = await billingService.getAccountByEmail(user.email);

      if (!account) {
        return response.ok({ invoices: [] });
      }
      const accountResponse = account as LagoAccountResponse;
      if (!accountResponse.customer?.external_id) {
        return response.ok({
          invoices: [],
        });
      }

      const invoices = await billingService.getInvoices(accountResponse.customer.external_id);

      return response.ok({
        invoices,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch invoices',
        error: error.message,
      });
    }
  }

  /**
   * @getPlans
   * @summary Get available billing plans
   * @description Retrieves all available billing plans from the billing provider. This is a public endpoint that doesn't require authentication.
   * @tag Billing
   * @response 200 - Plans retrieved successfully
   * @response 500 - Server error - Failed to fetch plans
   */
  async getPlans({ response }: HttpContext) {
    try {
      const plans = await billingService.getPlans();

      return response.ok({
        plans,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch plans',
        error: error.message,
      });
    }
  }

  /**
   * @addPaymentMethod
   * @summary Add payment method
   * @description Adds a payment method to the user's billing account. Currently not implemented - returns 501 Not Implemented.
   * @tag Billing
   * @requestBody {object} body - Payment method data
   * @requestBody {string} body.pluginName - Payment plugin/provider name (required)
   * @requestBody {object} body.pluginInfo - Payment plugin-specific information (required)
   * @response 501 - Not implemented - Payment method management not yet implemented
   * @response 400 - Bad request - Plugin name and info are required or account not found
   * @response 401 - Unauthorized - Authentication required
   */
  async addPaymentMethod({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!;
      const { pluginName, pluginInfo } = request.body();

      if (!pluginName || !pluginInfo) {
        return response.badRequest({
          message: 'Plugin name and info are required',
        });
      }

      const account = await billingService.getAccountByEmail(user.email);

      if (!account) {
        return response.badRequest({
          message: 'Account not found',
        });
      }

      // Note: addPaymentMethod doesn't exist in BillingService - implement or remove this endpoint
      return response.notImplemented({
        message: 'Payment method management not yet implemented',
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to add payment method',
        error: error.message,
      });
    }
  }

  /**
   * @getPaymentMethods
   * @summary Get payment methods
   * @description Retrieves all payment methods associated with the user's billing account. Currently returns empty array as payment method management is not yet implemented.
   * @tag Billing
   * @response 200 - Payment methods retrieved (currently always empty array)
   * @response 401 - Unauthorized - Authentication required
   * @response 500 - Server error - Failed to fetch payment methods
   */
  async getPaymentMethods({ response, auth }: HttpContext) {
    try {
      const user = auth.user!;

      const account = await billingService.getAccountByEmail(user.email);

      if (!account) {
        return response.ok({ paymentMethods: [] });
      }
      const accountResponse = account as LagoAccountResponse;
      if (!accountResponse || !accountResponse.customer?.external_id) {
        return response.ok({
          paymentMethods: [],
        });
      }

      // Note: getPaymentMethods doesn't exist in BillingService - implement or remove this endpoint
      return response.ok({
        paymentMethods: [],
        message: 'Payment method retrieval not yet implemented',
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch payment methods',
        error: error.message,
      });
    }
  }
}
