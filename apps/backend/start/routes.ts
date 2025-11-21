/*
||--------------------------------------------------------------------------
|| Routes file
||--------------------------------------------------------------------------
||
|| The routes file is used for defining the HTTP routes.
||
*/

import router from '@adonisjs/core/services/router';
import AutoSwagger from 'adonis-autoswagger';

import swagger from '#config/swagger';
import { middleware } from '#start/kernel';

const UserController = () => import('#controllers/user_controller');
const SpaceController = () => import('#controllers/space_controller');
const CmsProxyController = () => import('#controllers/cms_proxy_controller');
const BillingController = () => import('#controllers/billing_controller');
const AuthController = () => import('#controllers/auth_controller');
const AuthErrorsController = () => import('#controllers/admin/auth_errors_controller');
const AdminController = () => import('#controllers/admin/admin_controller');
const AdminSessionsController = () => import('#controllers/admin/admin_sessions_controller');

// Swagger documentation
/**
 * @summary Swagger JSON documentation
 * @description Returns the OpenAPI/Swagger JSON specification for the API
 * @tag Documentation
 */
router.get('/swagger', async () => AutoSwagger.default.docs(router.toJSON(), swagger));

/**
 * @summary Swagger UI documentation
 * @description Returns the Swagger UI interface for interactive API documentation
 * @tag Documentation
 */
router.get('/docs', async () => AutoSwagger.default.ui('/swagger', swagger));

// Health check
/**
 * @summary Health check endpoint
 * @description Returns the API health status and current timestamp. Useful for monitoring and load balancers.
 * @tag System
 * @response 200 - API is healthy
 */
router.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Root endpoint
/**
 * @summary API root endpoint
 * @description Returns basic API information including name, version, and status
 * @tag System
 * @response 200 - API information
 */
router.get('/', async () => ({
  name: 'Turborepo SaaS Starter API',
  version: '1.0.0',
  status: 'running',
}));

/*
||--------------------------------------------------------------------------
|| Public Routes
||--------------------------------------------------------------------------
*/
// Public user lookup by username (for username resolution in spaces)
/**
 * @summary Get user by username (public)
 * @description Public endpoint to retrieve user information by username. Used for username resolution in spaces and public profiles. Only returns active users.
 * @tag Public
 * @paramPath {string} username - Username to lookup (required)
 * @response 200 - User found and returned
 * @response 400 - Username is required
 * @response 404 - User not found or inactive
 * @response 500 - Server error
 */
router.get('/api/public/users/:username', [UserController, 'getByUsername']);

/*
||--------------------------------------------------------------------------
|| Authentication Routes (Better Auth)
||--------------------------------------------------------------------------
*/
// Better Auth endpoints (using controller for Swagger documentation)
// All methods use a shared handler to avoid code duplication
router.post('/api/auth/sign-in/email', [AuthController, 'signInEmail']);
router.post('/api/auth/sign-up/email', [AuthController, 'signUpEmail']);
router.post('/api/auth/sign-out', [AuthController, 'signOut']);
router.get('/api/auth/get-session', [AuthController, 'getSession']);

// Better Auth catch-all handler for all other auth routes
// This must come AFTER the specific routes above
router.any('/api/auth/*', [AuthController, 'catchAll']);

/*
||--------------------------------------------------------------------------
|| User Routes
||--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/me', [UserController, 'me']); // Get current user profile (merged from Adonis + Better Auth)
    router.patch('/me', [UserController, 'updateProfile']); // Update current user profile
    router.post('/avatar', [UserController, 'uploadAvatar']); // Avatar upload
    router.get('/users', [UserController, 'index']); // Admin only
    router.patch('/users/:id/toggle-status', [UserController, 'toggleStatus']); // Admin only

    // Space management
    router.get('/spaces', [SpaceController, 'index']);
    router.post('/spaces', [SpaceController, 'create']);
    router.patch('/spaces/:id', [SpaceController, 'update']);
    router.delete('/spaces/:id', [SpaceController, 'delete']);
  })
  .prefix('/api/user')
  .use(middleware.auth());

/*
||--------------------------------------------------------------------------
|| CMS Proxy Routes (Directus)
||--------------------------------------------------------------------------
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
||--------------------------------------------------------------------------
|| Admin Routes
||--------------------------------------------------------------------------
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
    router.post('/users', [AdminController, 'createUser']);
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
||--------------------------------------------------------------------------
|| Billing Routes (Lago)
||--------------------------------------------------------------------------
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

/*
|||--------------------------------------------------------------------------
||| Notifications Routes
|||--------------------------------------------------------------------------
*/
/**
 * @summary Get user notifications
 * @description Retrieves notifications for the current authenticated user. Returns a list of notifications including unread status, sender information, and timestamps.
 * @tag Notifications
 * @response 200 - Notifications retrieved successfully
 * @response 401 - Unauthorized - Authentication required
 */
router
  .get('/api/notifications', async ({ response, auth: _authContext }) => {
    await _authContext.check();
    // TODO: Implement actual notifications from database
    // For now, returning mock data structure
    return response.ok({
      notifications: [],
      message: 'Notifications endpoint - implement with actual notification service',
    });
  })
  .use(middleware.auth());
