import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import AuthSyncError from '#models/auth_sync_error';
import { AuthErrorLogger } from '#services/auth_error_logger';
import { AuthReconciliationService } from '#services/auth_reconciliation_service';

export default class AuthErrorsController {
  /**
   * @index
   * @summary List auth sync errors
   * @description Retrieves a paginated list of authentication synchronization errors between Better Auth and AdonisJS. Admin only endpoint.
   * @tag Admin
   * @paramQuery {integer} page - Page number (default: 1)
   * @paramQuery {integer} limit - Items per page (default: 50)
   * @paramQuery {string} event_type - Filter by event type
   * @paramQuery {boolean} handled - Filter by handled status (true/false)
   * @response 200 - List of auth sync errors retrieved successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   */
  async index({ auth, request, response }: HttpContext) {
    // Admin only
    await abilities.manageUsers.execute(auth.user!);

    const page = request.input('page', 1);
    const limit = request.input('limit', 50);
    const eventType = request.input('event_type');
    const handled = request.input('handled');

    let query = AuthSyncError.query();

    if (eventType) {
      query = query.where('eventType', eventType);
    }

    if (handled !== undefined) {
      query = query.where('handled', handled === 'true');
    }

    const errors = await query.orderBy('createdAt', 'desc').paginate(page, limit);

    return response.json(errors);
  }

  /**
   * @stats
   * @summary Get auth error statistics
   * @description Retrieves aggregated statistics about authentication synchronization errors, including counts by type and status. Admin only endpoint.
   * @tag Admin
   * @response 200 - Error statistics retrieved successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   */
  async stats({ auth, response }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const stats = await AuthErrorLogger.getErrorStats();
    return response.json(stats);
  }

  /**
   * @handle
   * @summary Mark error as handled
   * @description Marks an authentication synchronization error as handled/resolved. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} id - Error ID (UUID, required)
   * @response 200 - Error marked as handled successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - Error not found
   */
  async handle({ auth, params, response }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const error = await AuthSyncError.findOrFail(params.id);
    await error.markAsHandled();

    return response.json({
      message: 'Error marked as handled',
      error,
    });
  }

  /**
   * @reconcile
   * @summary Run auth reconciliation
   * @description Runs the authentication reconciliation process to sync users between Better Auth and AdonisJS, resolving any discrepancies. Admin only endpoint.
   * @tag Admin
   * @response 200 - Reconciliation completed with results
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 500 - Server error - Reconciliation failed
   */
  async reconcile({ auth, response }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const result = await AuthReconciliationService.runReconciliation();

    return response.json({
      message: 'Reconciliation complete',
      result,
    });
  }
}
