/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from "@adonisjs/core/services/router";
import AutoSwagger from "adonis-autoswagger";
import swagger from "#config/swagger";
import { middleware } from "#start/kernel";

const AuthController = () => import("#controllers/auth_controller");
const UserController = () => import("#controllers/user_controller");
const CmsProxyController = () => import("#controllers/cms_proxy_controller");
const BillingController = () => import("#controllers/billing_controller");

// Swagger documentation
router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});

router.get("/docs", async () => {
  return AutoSwagger.default.ui("/swagger", swagger);
});

// Health check
router.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Root endpoint
router.get("/", async () => {
  return {
    name: "Turborepo SaaS Starter API",
    version: "1.0.0",
    status: "running",
  };
});

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.post("/register", [AuthController, "register"]);
    router.post("/login", [AuthController, "login"]);
    router.post("/logout", [AuthController, "logout"]).use(middleware.auth());
    router.get("/me", [AuthController, "me"]).use(middleware.auth());
    router.post("/change-password", [AuthController, "changePassword"]).use(middleware.auth());
  })
  .prefix("/api/auth");

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get("/profile", [UserController, "profile"]);
    router.patch("/profile", [UserController, "updateProfile"]);
    router.get("/users", [UserController, "index"]); // Admin only
    router.patch("/users/:id/toggle-status", [UserController, "toggleStatus"]); // Admin only
  })
  .prefix("/api/user")
  .use(middleware.auth());

/*
|--------------------------------------------------------------------------
| CMS Proxy Routes (Directus)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Collection shortcuts
    router.get("/collections/:collection", [CmsProxyController, "getCollection"]);
    router.get("/collections/:collection/:id", [CmsProxyController, "getItem"]);

    // Generic proxy routes
    router.get("/*", [CmsProxyController, "get"]);
    router.post("/*", [CmsProxyController, "post"]);
    router.patch("/*", [CmsProxyController, "patch"]);
    router.delete("/*", [CmsProxyController, "delete"]);
  })
  .prefix("/api/cms");

/*
|--------------------------------------------------------------------------
| Billing Routes (Kill Bill)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Account management
    router.get("/account", [BillingController, "getOrCreateAccount"]);

    // Subscriptions
    router.get("/subscriptions", [BillingController, "getSubscriptions"]);
    router.post("/subscriptions", [BillingController, "createSubscription"]);
    router.delete("/subscriptions/:id", [BillingController, "cancelSubscription"]);

    // Invoices
    router.get("/invoices", [BillingController, "getInvoices"]);

    // Payment methods
    router.get("/payment-methods", [BillingController, "getPaymentMethods"]);
    router.post("/payment-methods", [BillingController, "addPaymentMethod"]);

    // Plans (public)
    router.get("/plans", [BillingController, "getPlans"]);
  })
  .prefix("/api/billing")
  .use(middleware.auth());
