---
title: 'Architecture & Flow Diagrams'
description: 'Quick reference with authentication flow diagrams and file structure'
navigation:
  title: 'Architecture & Flow Diagrams'
  order: 2
---

# Better Auth Architecture - Quick Reference

> 📖 For complete documentation, see [Authentication Guide](./1.authentication)

## Overview

This document provides a quick reference for understanding the Better Auth integration architecture in this monorepo.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Full System Flow                            │
└─────────────────────────────────────────────────────────────────────┘

                           [Browser]
                              │
                              │ HTTP Request
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Nuxt.js :3000)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Better Auth Client (lib/auth-client.ts)                        │
│     └─ signIn.email(), signUp.email(), signOut(), getSession()    │
│                              │                                      │
│                              ↓                                      │
│  2. Nuxt Server Proxy (server/api/auth/[...].ts)                  │
│     └─ Catches: /api/auth/*                                        │
│     └─ Forwards to: http://localhost:3333/api/auth/*              │
│     └─ Preserves: Headers, Cookies, Body                          │
│     └─ Returns: Response with Set-Cookie headers                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              │ Same-origin proxy
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Backend (AdonisJS :3333)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  3. Route Handler (start/routes.ts)                                │
│     └─ router.any("/api/auth/*", handler)                          │
│                              │                                      │
│                              ↓                                      │
│  4. Helper Utilities (app/utils/better_auth_helpers.ts)           │
│     ┌────────────────────────────────────────────────┐            │
│     │ toWebRequest(adonisReq) → Web Request          │            │
│     │ fromWebResponse(webRes, adonisRes) → Response  │            │
│     └────────────────────────────────────────────────┘            │
│                              │                                      │
│                              ↓                                      │
│  5. Better Auth Handler (config/better_auth.ts)                    │
│     └─ auth.handler(webRequest)                                    │
│     └─ Processes authentication logic                              │
│     └─ Interacts with database                                     │
│     └─ Returns Web Response with cookies                           │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tables:                                                            │
│  ├─ user          (user accounts, email, name, emailVerified)     │
│  ├─ session       (active sessions, token, expiresAt, userId)     │
│  ├─ account       (OAuth + passwords, providerId, accountId)      │
│  └─ verification  (email verification tokens)                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Files

### Frontend (apps/web)

#### Core Authentication Files

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `app/lib/auth-client.ts` | ~19 | Better Auth client initialization | `authClient`, `signIn`, `signUp`, `signOut`, `getSession` |
| `app/composables/useAuth.ts` | ~140 | Vue composable for auth state management | `useAuth()` with `login()`, `register()`, `logout()`, `fetchUser()` |
| `server/api/auth/[...].ts` | ~60 | Nuxt server proxy route (same-origin) | `defineEventHandler` - forwards requests to backend |
| `app/middleware/auth.ts` | ~20 | Route middleware for protected pages | Redirects to `/login` if not authenticated |

#### Usage Examples

| File | Purpose | How It Uses Auth |
|------|---------|-----------------|
| `app/pages/login.vue` | Login page | Calls `useAuth().login()` |
| `app/pages/signup.vue` | Registration page | Calls `useAuth().register()` |
| `app/layouts/dashboard.vue` | Dashboard layout | Uses `useAuth().user` to display user info |
| `app/pages/dashboard/*.vue` | Protected pages | Uses `definePageMeta({ middleware: 'auth' })` |

#### Configuration Files

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Nuxt configuration (modules, security headers) |
| `.env` | Environment variables (not tracked in git) |
| `env.example` | Environment variable template |

### Backend (apps/backend)

#### Core Authentication Files

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `config/better_auth.ts` | ~93 | Better Auth server configuration | `auth` instance |
| `start/routes.ts` | ~120 | Route handler with direct pattern | `router.any("/api/auth/*", handler)` |
| `app/utils/better_auth_helpers.ts` | ~30 | Request/Response converters | `toWebRequest()`, `fromWebResponse()` |
| `app/middleware/auth_middleware.ts` | ~30 | Protected route middleware | Validates sessions via `auth.getSessionFromRequest()` |

#### Database Files

| File | Purpose |
|------|---------|
| `database/migrations/3_create_better_auth_tables.ts` | Creates `user`, `session`, `account`, `verification` tables |

#### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Package imports configuration (includes `#utils/*` alias) |
| `start/env.ts` | Environment variable schema validation |
| `.env` | Environment variables (not tracked in git) |
| `env.example` | Environment variable template |

### Quick File Lookup by Feature

#### Need to modify login/signup behavior?
- **Frontend:** `app/composables/useAuth.ts`
- **Backend:** `config/better_auth.ts`

#### Need to add a protected route?
- **Frontend:** Add `middleware: 'auth'` to page meta
- **Backend:** Add `.use(middleware.auth())` to route

#### Need to customize session duration?
- **File:** `apps/backend/config/better_auth.ts`
- **Property:** `session.expiresIn`

#### Need to add OAuth provider?
- **File:** `apps/backend/config/better_auth.ts`
- **Section:** `socialProviders`
- **Env:** Add `PROVIDER_CLIENT_ID` and `PROVIDER_CLIENT_SECRET`

#### Need to change authentication endpoints?
- **File:** `apps/backend/start/routes.ts`
- **Line:** Route handler pattern (`router.any("/api/auth/*")`)

#### Need to debug authentication issues?
- **Proxy:** `apps/web/server/api/auth/[...].ts`
- **Handler:** `apps/backend/start/routes.ts`
- **Helpers:** `apps/backend/app/utils/better_auth_helpers.ts`

## Request Flow (Login Example)

```
[1] User submits login form
    ↓
[2] useAuth.login("user@example.com", "password")
    ↓
[3] Better Auth Client: signIn.email({ email, password })
    → POST /api/auth/sign-in/email
    ↓
[4] Nuxt Proxy: Forward to http://localhost:3333/api/auth/sign-in/email
    ↓
[5] AdonisJS Route: router.any("/api/auth/*", handler)
    ↓
[6] toWebRequest(): Convert AdonisJS Request → Web Request
    ↓
[7] Better Auth: auth.handler(webRequest)
    - Query user by email
    - Verify password hash
    - Create session in database
    - Generate response with Set-Cookie
    ↓
[8] fromWebResponse(): Convert Web Response → AdonisJS Response
    ↓
[9] Proxy: Forward response to frontend (preserves Set-Cookie)
    ↓
[10] Browser: Store cookie, update user state, redirect to dashboard
```

## Helper Utilities Explained

### toWebRequest()

**Purpose:** Convert AdonisJS Request to Web Standard Request

**Input:**
```typescript
HttpContext["request"] // AdonisJS request object
```

**Process:**
1. Build URL from request path and host
2. Extract HTTP method (GET, POST, etc.)
3. Copy all headers
4. Read and stringify request body (if present)
5. Create `new Request(url, { method, headers, body })`

**Output:**
```typescript
Request // Web API Request object
```

### fromWebResponse()

**Purpose:** Convert Web Standard Response to AdonisJS Response

**Input:**
```typescript
Response // Web API Response (from Better Auth)
HttpContext["response"] // AdonisJS response object
```

**Process:**
1. Copy status code
2. Forward all headers (including Set-Cookie)
3. Read response body as text
4. Send via AdonisJS response

**Output:**
```typescript
HttpContext["response"] // Configured AdonisJS response
```

## API Endpoints

All authentication endpoints are handled by Better Auth:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/sign-in/email` | POST | Email/password login |
| `/api/auth/sign-up/email` | POST | Email/password registration |
| `/api/auth/sign-out` | POST | Logout (clear session) |
| `/api/auth/get-session` | GET | Check authentication status |
| `/api/auth/google` | GET | Google OAuth redirect |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/github` | GET | GitHub OAuth redirect |
| `/api/auth/callback/github` | GET | GitHub OAuth callback |

## Development vs Production

### Development (localhost)

- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:3333`
- **Proxy:** Required (same-origin cookies)
- **Cookies:** Stored on `localhost:3000` domain
- **SameSite:** `Lax` (works with proxy)

### Production

- **Frontend:** `https://yourdomain.com`
- **Backend:** `https://api.yourdomain.com`
- **Proxy:** Optional (can use direct CORS)
- **Cookies:** Secure, HttpOnly
- **SameSite:** `Lax` or `Strict`

## Cookie Details

**Cookie Name:** `better_auth.session_token`

**Attributes:**
- `HttpOnly: true` - Not accessible via JavaScript (XSS protection)
- `SameSite: Lax` - Sent with same-site requests and top-level navigation
- `Secure: true` - Only sent over HTTPS (production only)
- `Max-Age: 604800` - 7 days (configurable)
- `Path: /` - Available for all routes

## Session Management

| Property | Value | Description |
|----------|-------|-------------|
| **Duration** | 7 days | Session expires after this period |
| **Update Age** | 24 hours | Session refreshed if older than this |
| **Storage** | PostgreSQL | Sessions stored in `session` table |
| **Token** | Random hash | Unique session identifier |

**Session Refresh Logic:**
```
if (session.updatedAt < NOW() - 24 hours) {
  UPDATE session
  SET updatedAt = NOW(),
      expiresAt = NOW() + 7 days
  WHERE token = ?
}
```

## Environment Variables

### Required

```bash
# Backend
BETTER_AUTH_SECRET=random-32-char-string  # Generate with crypto.randomBytes(32)
BETTER_AUTH_URL=http://localhost:3333     # Backend URL
DB_CONNECTION=postgres                     # Database type

# Frontend
NUXT_PUBLIC_API_URL=http://localhost:3333  # Backend URL for production
```

### Optional (OAuth)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## Common Operations

### Check if User is Authenticated

```typescript
// Frontend
const { user, fetchUser } = useAuth();
await fetchUser();

if (user.value) {
  // User is authenticated
} else {
  // User is not authenticated
}
```

### Protect a Route

```vue
<!-- pages/dashboard/index.vue -->
<script setup>
definePageMeta({
  middleware: 'auth'
});
</script>
```

### Protect a Backend Route

```typescript
// start/routes.ts
router.get('/api/user/profile', [UserController, 'profile'])
  .use(middleware.auth());
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cookie not set | Check proxy is forwarding Set-Cookie headers |
| Session not persisting | Ensure `cookieCache.enabled: false` in config |
| 401 Unauthorized | Session expired or invalid, user needs to login |
| CORS errors | Use proxy in development, configure CORS in production |
| Database errors | Check table names are correct (camelCase columns) |

## Further Reading

- [Authentication Guide](./1.authentication) - Complete authentication guide
- [BETTER_AUTH_INTEGRATION.md](./BETTER_AUTH_INTEGRATION.md) - Implementation details
- [BETTER_AUTH_FIXES.md](./BETTER_AUTH_FIXES.md) - Issues resolved during integration
- [Better Auth Docs](https://www.better-auth.com/docs)

