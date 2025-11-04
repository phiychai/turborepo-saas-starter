import type { HttpContext } from '@adonisjs/core/http';
import AuthSyncError from '#models/auth_sync_error';
import { AuthErrorLogger } from '#services/auth_error_logger';
import { AuthReconciliationService } from '#services/auth_reconciliation_service';
import * as abilities from '#abilities/main';

export default class AuthErrorsController {
  /**
   * List auth sync errors
   * GET /api/admin/auth-errors
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
   * Get error statistics
   * GET /api/admin/auth-errors/stats
   */
  async stats({ auth, response }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const stats = await AuthErrorLogger.getErrorStats();
    return response.json(stats);
  }

  /**
   * Mark error as handled
   * PATCH /api/admin/auth-errors/:id/handle
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
   * Retry reconciliation
   * POST /api/admin/auth-errors/reconcile
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

