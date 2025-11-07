/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router';
import AutoSwagger from 'adonis-autoswagger';

import { auth } from '#config/better_auth';
import swagger from '#config/swagger';
import { middleware } from '#start/kernel';
import { toWebRequest, fromWebResponse } from '#utils/better_auth_helpers';

const UserController = () => import('#controllers/user_controller');
const CmsProxyController = () => import('#controllers/cms_proxy_controller');
const BillingController = () => import('#controllers/billing_controller');
const AuthErrorsController = () => import('#controllers/admin/auth_errors_controller');
const AdminController = () => import('#controllers/admin/admin_controller');
const AdminSessionsController = () => import('#controllers/admin/admin_sessions_controller');

// Swagger documentation
router.get('/swagger', async () => AutoSwagger.default.docs(router.toJSON(), swagger));

router.get('/docs', async () => AutoSwagger.default.ui('/swagger', swagger));

// Health check
router.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Root endpoint
router.get('/', async () => ({
  name: 'Turborepo SaaS Starter API',
  version: '1.0.0',
  status: 'running',
}));

/*
|--------------------------------------------------------------------------
| Authentication Routes (Better Auth)
|--------------------------------------------------------------------------
*/
// Better Auth direct handler (recommended pattern)
// Converts AdonisJS Request/Response to Web Standard Request/Response
router.any('/api/auth/*', async ({ request, response }) => {
  try {
    const webRequest = await toWebRequest(request);
    const authResponse = await auth.handler(webRequest);
    return await fromWebResponse(authResponse, response);
  } catch (error) {
    console.error('Better Auth handler error:', error);
    return response.status(500).send({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/me', [UserController, 'me']); // New endpoint - merged profile
    router.get('/profile', [UserController, 'profile']); // Keep existing for backward compatibility
    router.patch('/profile', [UserController, 'updateProfile']);
    router.get('/users', [UserController, 'index']); // Admin only
    router.patch('/users/:id/toggle-status', [UserController, 'toggleStatus']); // Admin only
  })
  .prefix('/api/user')
  .use(middleware.auth());

/*
|--------------------------------------------------------------------------
| CMS Proxy Routes (Directus)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Collection shortcuts
    router.get('/collections/:collection', [CmsProxyController, 'getCollection']);
    router.get('/collections/:collection/:id', [CmsProxyController, 'getItem']);

    // Generic proxy routes
    router.get('/*', [CmsProxyController, 'get']);
    router.post('/*', [CmsProxyController, 'post']);
    router.patch('/*', [CmsProxyController, 'patch']);
    router.delete('/*', [CmsProxyController, 'delete']);
  })
  .prefix('/api/cms');

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Auth error management
    router.get('/auth-errors', [AuthErrorsController, 'index']);
    router.get('/auth-errors/stats', [AuthErrorsController, 'stats']);
    router.patch('/auth-errors/:id/handle', [AuthErrorsController, 'handle']);
    router.post('/auth-errors/reconcile', [AuthErrorsController, 'reconcile']);

    // User management (admin only)
    router.get('/users', [AdminController, 'listUsers']);
    router.get('/users/:id', [AdminController, 'getUser']);
    router.patch('/users/:id', [AdminController, 'updateUser']);
    router.delete('/users/:id', [AdminController, 'deleteUser']);
    router.patch('/users/:id/toggle-status', [AdminController, 'toggleStatus']);
    router.post('/users/sync-all', [AdminController, 'syncAllUsers']);
    router.post('/users/sync', [AdminController, 'syncUser']);

    // Session management (Better Auth Admin plugin)
    router.get('/users/:id/sessions', [AdminSessionsController, 'listUserSessions']);
    router.delete('/users/:id/sessions', [AdminSessionsController, 'revokeAllSessions']);
    router.delete('/sessions/:sessionToken', [AdminSessionsController, 'revokeSession']);
  })
  .prefix('/api/admin')
  .use(middleware.auth());

/*
|--------------------------------------------------------------------------
| Billing Routes (Lago)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Account management
    router.get('/account', [BillingController, 'getOrCreateAccount']);

    // Subscriptions
    router.get('/subscriptions', [BillingController, 'getSubscriptions']);
    router.post('/subscriptions', [BillingController, 'createSubscription']);
    router.delete('/subscriptions/:id', [BillingController, 'cancelSubscription']);

    // Invoices
    router.get('/invoices', [BillingController, 'getInvoices']);

    // Payment methods
    router.get('/payment-methods', [BillingController, 'getPaymentMethods']);
    router.post('/payment-methods', [BillingController, 'addPaymentMethod']);

    // Plans (public)
    router.get('/plans', [BillingController, 'getPlans']);
  })
  .prefix('/api/billing')
  .use(middleware.auth());
