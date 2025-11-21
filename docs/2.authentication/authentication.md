---
title: 'Authentication Guide (Legacy)'
description: 'Legacy authentication documentation - see new plan for implementation'
navigation:
  title: 'Auth Guide (Legacy)'
  order: 99
---

# Authentication System (Legacy Documentation)

> **⚠️ This documentation is legacy. See the [new Authentication & Registration Plan](./1.authentication-plan.md) for the current implementation roadmap.**

## Overview

This project uses **[Better Auth](https://www.better-auth.com/)** - a modern, type-safe authentication library for TypeScript. Better Auth provides a comprehensive authentication solution with support for email/password, OAuth providers (Google, GitHub), and secure session management.

## Current Implementation Status

The authentication system is being refactored according to the new plan:

- **[View Authentication & Registration Plan](./1.authentication-plan.md)** - Complete implementation roadmap with milestones

## Legacy Table of Contents

1. [Files Reference](#files-reference)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Configuration](#configuration)
5. [Development Proxy Setup](#development-proxy-setup)
6. [Usage](#usage)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

## Files Reference

### Frontend Files (apps/web)

#### Core Authentication Files

| File Path | Purpose | Key Exports/Features |
|-----------|---------|---------------------|
| `app/lib/auth-client.ts` | Better Auth client initialization | `authClient`, `signIn`, `signUp`, `signOut`, `getSession` |
| `app/composables/useAuth.ts` | Vue composable for auth state | `useAuth()` - `login()`, `register()`, `logout()`, `fetchUser()`, `user`, `loading` |
| `server/api/auth/[...].ts` | Nuxt server proxy route | Forwards `/api/auth/*` to backend, preserves cookies |
| `app/middleware/auth.ts` | Route protection middleware | Redirects unauthenticated users to `/login` |

#### Usage in Pages/Components

| File Path | Purpose |
|-----------|---------|
| `app/pages/login.vue` | Login page with email/password form |
| `app/pages/signup.vue` | Registration page with user creation |
| `app/layouts/dashboard.vue` | Protected dashboard layout using `useAuth()` |
| `app/pages/dashboard/*.vue` | Protected dashboard pages with `middleware: 'auth'` |

#### Configuration

| File Path | Purpose |
|-----------|---------|
| `nuxt.config.ts` | Nuxt configuration (security headers, modules) |
| `.env` / `env.example` | Environment variables (`NUXT_PUBLIC_API_URL`, etc.) |

### Backend Files (apps/backend)

#### Core Authentication Files

| File Path | Purpose | Key Features |
|-----------|---------|--------------|
| `config/better_auth.ts` | Better Auth server configuration | Database connection, OAuth providers, session settings, `auth` instance export |
| `start/routes.ts` | Authentication route handler | `router.any("/api/auth/*", handler)` - direct handler pattern |
| `app/utils/better_auth_helpers.ts` | Request/Response converters | `toWebRequest()`, `fromWebResponse()` |
| `app/middleware/auth_middleware.ts` | Protected route middleware | Validates session using `auth.getSessionFromRequest()` |

#### Database

| File Path | Purpose |
|-----------|---------|
| `database/migrations/3_create_better_auth_tables.ts` | Database schema migration for Better Auth tables (`user`, `session`, `account`, `verification`) |

#### Configuration

| File Path | Purpose |
|-----------|---------|
| `package.json` | Package imports configuration (`#utils/*` alias) |
| `start/env.ts` | Environment variable schema validation |
| `.env` / `env.example` | Environment variables (`BETTER_AUTH_SECRET`, `DB_*`, OAuth credentials) |

### File Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (apps/web)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Interaction Layer:                                        │
│  ├─ pages/login.vue          ──────┐                           │
│  ├─ pages/signup.vue         ──────┤                           │
│  └─ layouts/dashboard.vue    ──────┤                           │
│                                     ↓                           │
│  Composable Layer:                                              │
│  └─ composables/useAuth.ts   ──────┐                           │
│                                     ↓                           │
│  Client Layer:                                                  │
│  └─ lib/auth-client.ts       ──────┐                           │
│                                     ↓                           │
│  Proxy Layer:                                                   │
│  └─ server/api/auth/[...].ts ──────┼─── Forwards to Backend    │
│                                     │                           │
│  Middleware:                        │                           │
│  └─ middleware/auth.ts       ──────┘                           │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (apps/backend)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Route Layer:                                                   │
│  └─ start/routes.ts          ──────┐                           │
│                                     ↓                           │
│  Helper Layer:                                                  │
│  └─ app/utils/better_auth_helpers.ts ───┐                      │
│                                          ↓                      │
│  Better Auth Layer:                                             │
│  └─ config/better_auth.ts    ──────┐                           │
│                                     ↓                           │
│  Database Layer:                                                │
│  └─ database/migrations/3_create_better_auth_tables.ts         │
│                                     ↓                           │
│  Middleware:                                                    │
│  └─ app/middleware/auth_middleware.ts                          │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ↓ SQL
                              ┌──────────────┐
                              │  PostgreSQL  │
                              │   Database   │
                              └──────────────┘
```

### Environment Files

| File | Location | Purpose |
|------|----------|---------|
| `.env` | Root | Docker Compose environment variables |
| `apps/backend/.env` | Backend | Backend-specific config (database, Better Auth secret, OAuth) |
| `apps/web/.env` | Frontend | Frontend-specific config (API URL, site URL) |
| `env.example` | All locations | Template with placeholder values |

## Architecture

### Technology Stack

- **Backend**: Better Auth server running in AdonisJS
- **Database**: PostgreSQL (with support for SQLite in development)
- **Frontend**: Better Auth Vue/Nuxt client
- **Session Storage**: Cookie-based sessions with PostgreSQL persistence

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Nuxt.js)                       │
│                   http://localhost:3000                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Better Auth Client (apps/web/app/lib/auth-client.ts)│  │
│  │  - signIn.email()                                     │  │
│  │  - signUp.email()                                     │  │
│  │  - signOut()                                          │  │
│  │  - getSession()                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Proxy: /api/auth → localhost:3333
                        │ (Development only, same-origin)
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend (AdonisJS)                        │
│                 http://localhost:3333                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Route Handler (start/routes.ts)                     │  │
│  │  router.any("/api/auth/*", handler)                  │  │
│  │  ↓                                                     │  │
│  │  Better Auth Server (config/better_auth.ts)          │  │
│  │  - Handles authentication requests                    │  │
│  │  - Manages sessions                                   │  │
│  │  - Sets secure cookies                                │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                         │
│                                                             │
│  Tables:                                                    │
│  - user          (user accounts)                           │
│  - session       (active sessions)                         │
│  - account       (OAuth accounts & passwords)              │
│  - verification  (email verification tokens)               │
└─────────────────────────────────────────────────────────────┘
```

### Direct Handler Pattern

The backend uses a **direct handler pattern** (recommended by Better Auth) instead of a controller wrapper. This provides cleaner, more maintainable code:

```
┌───────────────────────────────────────────────────────────────┐
│                      Request Flow                             │
└───────────────────────────────────────────────────────────────┘

1. Browser sends request to frontend
   ↓
   POST http://localhost:3000/api/auth/sign-in/email
   Headers: { Cookie: "..." }
   Body: { email: "user@example.com", password: "..." }

2. Nuxt Server Proxy (apps/web/server/api/auth/[...].ts)
   ↓
   - Forwards to backend: http://localhost:3333/api/auth/sign-in/email
   - Preserves headers, cookies, and body
   - Makes request appear same-origin to browser

3. AdonisJS Route Handler (apps/backend/start/routes.ts)
   ↓
   router.any("/api/auth/*", async ({ request, response }) => {
     // Convert AdonisJS Request → Web Standard Request
     const webRequest = await toWebRequest(request);

     // Better Auth processes the request
     const authResponse = await auth.handler(webRequest);

     // Convert Web Response → AdonisJS Response
     return await fromWebResponse(authResponse, response);
   });

4. Helper Utilities (apps/backend/app/utils/better_auth_helpers.ts)
   ↓
   toWebRequest():
   - Extracts URL, method, headers from AdonisJS Request
   - Reads and formats request body
   - Creates standard Web API Request object

   fromWebResponse():
   - Copies status code from Web Response
   - Forwards all headers (especially Set-Cookie)
   - Returns response body to AdonisJS

5. Better Auth Handler (apps/backend/config/better_auth.ts)
   ↓
   - Validates credentials against database
   - Creates session record in PostgreSQL
   - Generates session token
   - Returns response with Set-Cookie header

6. Response Flow (back through proxy)
   ↓
   Response headers:
   Set-Cookie: better_auth.session_token=...; HttpOnly; SameSite=Lax

   Browser receives:
   - 200 OK with user data
   - Session cookie stored on localhost:3000 domain
```

### Request/Response Transformation Details

**Why we need transformation:**
- Better Auth expects standard Web API `Request` objects
- AdonisJS uses its own `HttpContext` request/response objects
- Helper utilities bridge the gap

**toWebRequest() Function:**
```typescript
// Input: AdonisJS Request (HttpContext["request"])
// Output: Standard Web API Request

const webRequest = new Request(url, {
  method: request.method(),          // GET, POST, etc.
  headers: request.headers(),        // All HTTP headers
  body: JSON.stringify(requestBody)  // Request payload
});
```

**fromWebResponse() Function:**
```typescript
// Input: Web API Response (from Better Auth)
// Output: AdonisJS Response (HttpContext["response"])

response.status(webResponse.status);              // 200, 401, etc.
webResponse.headers.forEach((value, key) => {
  response.header(key, value);                    // Copy all headers
});
return response.send(await webResponse.text());   // Send body
```

### Authentication Flow Example (Login)

```
┌──────────────────────────────────────────────────────────────────┐
│                     Login Flow Step-by-Step                      │
└──────────────────────────────────────────────────────────────────┘

[Frontend: User clicks "Login"]
  ↓
1. useAuth.login("user@example.com", "password123")
  ↓
2. Better Auth Client (auth-client.ts)
   signIn.email({ email, password })
   → POST /api/auth/sign-in/email
  ↓
3. Nuxt Proxy catches request
   → Forwards to http://localhost:3333/api/auth/sign-in/email
  ↓
4. AdonisJS receives at route handler
   router.any("/api/auth/*", handler)
  ↓
5. toWebRequest() converts to Web Request
   {
     url: "http://localhost:3333/api/auth/sign-in/email",
     method: "POST",
     headers: { "content-type": "application/json", ... },
     body: '{"email":"user@example.com","password":"..."}'
   }
  ↓
6. Better Auth handler processes
   - Queries database: SELECT * FROM "user" WHERE email = ?
   - Queries account: SELECT password FROM "account" WHERE userId = ?
   - Verifies password hash (bcrypt)
   - Creates session: INSERT INTO "session" (id, token, userId, ...)
   - Generates response with Set-Cookie header
  ↓
7. fromWebResponse() converts back
   Response {
     status: 200,
     headers: {
       "set-cookie": "better_auth.session_token=abc123; HttpOnly",
       "content-type": "application/json"
     },
     body: '{"user":{"id":"1","email":"user@example.com"}}'
   }
  ↓
8. Proxy forwards response to frontend
   - Preserves Set-Cookie header
   - Browser stores cookie on localhost:3000 domain
  ↓
9. Frontend receives response
   - Updates user state
   - Redirects to dashboard
   - Subsequent requests include session cookie automatically

[User is now authenticated! 🎉]
```

### All Authentication Flows

#### Registration Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Registration Flow                         │
└──────────────────────────────────────────────────────────────┘

Frontend: useAuth.register({ email, password, fullName })
  ↓
POST /api/auth/sign-up/email
  ↓
Proxy → Backend → toWebRequest()
  ↓
Better Auth:
  1. Check if email exists: SELECT * FROM "user" WHERE email = ?
  2. Hash password (bcrypt, 10 rounds)
  3. Create user: INSERT INTO "user" (id, email, name, ...)
  4. Create account: INSERT INTO "account" (userId, password, ...)
  5. Create session: INSERT INTO "session" (userId, token, ...)
  6. Return user data + Set-Cookie
  ↓
fromWebResponse() → Proxy → Frontend
  ↓
User registered and logged in ✅
```

#### Logout Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Logout Flow                             │
└──────────────────────────────────────────────────────────────┘

Frontend: useAuth.logout()
  ↓
POST /api/auth/sign-out
Headers: Cookie: better_auth.session_token=abc123
  ↓
Proxy → Backend → toWebRequest()
  ↓
Better Auth:
  1. Parse session token from cookie
  2. Delete session: DELETE FROM "session" WHERE token = ?
  3. Clear cookie: Set-Cookie: better_auth.session_token=; Max-Age=0
  ↓
fromWebResponse() → Proxy → Frontend
  ↓
User logged out, cookie cleared ✅
```

#### Get Session Flow (Check if Authenticated)

```
┌──────────────────────────────────────────────────────────────┐
│                   Get Session Flow                           │
└──────────────────────────────────────────────────────────────┘

Frontend: useAuth.fetchUser() or middleware check
  ↓
GET /api/auth/get-session
Headers: Cookie: better_auth.session_token=abc123
  ↓
Proxy → Backend → toWebRequest()
  ↓
Better Auth:
  1. Parse session token from cookie
  2. Query session: SELECT * FROM "session" WHERE token = ?
  3. Check if expired: expiresAt > NOW()
  4. Join user: SELECT * FROM "user" WHERE id = session.userId
  5. Return session + user data
  ↓
fromWebResponse() → Proxy → Frontend
  ↓
Session valid, user data returned ✅
OR
Session invalid/expired, 401 Unauthorized ❌
```

#### OAuth Flow (Google/GitHub)

```
┌──────────────────────────────────────────────────────────────┐
│                     OAuth Flow (Google)                      │
└──────────────────────────────────────────────────────────────┘

Frontend: signIn.social({ provider: 'google' })
  ↓
[1] Redirect to Google OAuth URL
    GET /api/auth/google
    → Redirects to: https://accounts.google.com/o/oauth2/v2/auth
    ↓
[2] User authenticates with Google
    → Google redirects back to callback URL
    → http://localhost:3333/api/auth/callback/google?code=xyz&state=abc
    ↓
[3] Backend receives callback
    GET /api/auth/callback/google?code=xyz
    ↓
[4] Better Auth processes OAuth:
    - Exchange code for tokens (POST to Google)
    - Fetch user profile from Google
    - Check if user exists: SELECT * FROM "user" WHERE email = ?

    If new user:
      - INSERT INTO "user" (id, email, name, image, emailVerified)
      - INSERT INTO "account" (userId, providerId='google', accountId, ...)

    If existing user:
      - Update account tokens

    - Create session: INSERT INTO "session" (userId, token, ...)
    - Set-Cookie: better_auth.session_token=...
    ↓
[5] Redirect to frontend
    → http://localhost:3000/dashboard
    → Cookie automatically included
    ↓
User logged in via Google ✅
```

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                        │
└─────────────────────────────────────────────────────────────┘

[Create Session]
  Login/Register
  ↓
  INSERT INTO "session" (
    id: nanoid(),
    token: random_hash,
    userId: user.id,
    expiresAt: NOW() + 7 days,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    createdAt: NOW(),
    updatedAt: NOW()
  )
  ↓
  Set-Cookie: better_auth.session_token=xyz;
    HttpOnly;
    SameSite=Lax;
    Max-Age=604800 (7 days)

[Validate Session]
  Every authenticated request
  ↓
  1. Parse cookie: better_auth.session_token
  2. Query: SELECT * FROM "session" WHERE token = ? AND expiresAt > NOW()
  3. If found → valid ✅
  4. If not found/expired → invalid ❌

[Update Session]
  If session age > 24 hours (updateAge)
  ↓
  UPDATE "session"
  SET updatedAt = NOW(),
      expiresAt = NOW() + 7 days
  WHERE token = ?
  ↓
  Session lifetime extended

[Delete Session]
  Logout
  ↓
  DELETE FROM "session" WHERE token = ?
  ↓
  Set-Cookie: better_auth.session_token=; Max-Age=0
  ↓
  Session destroyed

[Session Expiry]
  After 7 days of inactivity (or updateAge without update)
  ↓
  expiresAt < NOW()
  ↓
  Session considered invalid
  ↓
  User must login again
```

## Database Schema

Better Auth uses **camelCase** column names by default:

### `user` Table
```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  image TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

### `session` Table
```sql
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);
```

### `account` Table
```sql
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope TEXT,
  password TEXT,  -- Hashed password for email/password auth
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
  UNIQUE("providerId", "accountId")
);
```

### `verification` Table
```sql
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
```

## Configuration

### Backend Configuration

**File:** `apps/backend/config/better_auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import Database from "better-sqlite3";
import env from "#start/env";

export const auth = betterAuth({
  // Database connection (PostgreSQL in production, SQLite for dev)
  database: new Pool({
    host: env.get("DB_HOST"),
    port: env.get("DB_PORT"),
    user: env.get("DB_USER"),
    password: env.get("DB_PASSWORD"),
    database: env.get("DB_DATABASE"),
  }),

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: env.get("GOOGLE_CLIENT_ID"),
      clientSecret: env.get("GOOGLE_CLIENT_SECRET"),
      enabled: !!(env.get("GOOGLE_CLIENT_ID") && env.get("GOOGLE_CLIENT_SECRET")),
    },
    github: {
      clientId: env.get("GITHUB_CLIENT_ID"),
      clientSecret: env.get("GITHUB_CLIENT_SECRET"),
      enabled: !!(env.get("GITHUB_CLIENT_ID") && env.get("GITHUB_CLIENT_SECRET")),
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // 1 day
    cookieCache: {
      enabled: false, // Keep disabled to ensure session_token is used
    },
  },

  // Advanced settings
  advanced: {
    cookiePrefix: "better_auth",
    useSecureCookies: env.get("NODE_ENV") === "production",
    defaultCookieAttributes: {
      sameSite: "lax", // Secure default for cookies
    },
  },

  // Trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    env.get("NUXT_PUBLIC_SITE_URL"),
  ],

  secret: env.get("BETTER_AUTH_SECRET"),
  baseURL: env.get("BETTER_AUTH_URL"),
});
```

### Frontend Configuration

**File:** `apps/web/app/lib/auth-client.ts`

```typescript
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  // Use proxy in development (same-origin)
  // Use API URL in production (cross-origin)
  baseURL: process.env.NODE_ENV === 'production'
    ? (process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3333')
    : undefined,

  fetchOptions: {
    credentials: 'include', // Send cookies with requests
  },
});

export const { signIn, signUp, signOut, getSession } = authClient;
```

### Backend Routes

**File:** `apps/backend/start/routes.ts`

Better Auth uses a direct handler pattern (recommended approach):

```typescript
import { auth } from "#config/better_auth";
import { toWebRequest, fromWebResponse } from "#app/utils/better_auth_helpers";

// Better Auth direct handler
router.any("/api/auth/*", async ({ request, response }) => {
  try {
    const webRequest = await toWebRequest(request);
    const authResponse = await auth.handler(webRequest);
    return await fromWebResponse(authResponse, response);
  } catch (error) {
    return response.status(500).send({ error: "Authentication failed" });
  }
});
```

**Helper Utilities** (`apps/backend/app/utils/better_auth_helpers.ts`):

Converts between AdonisJS and Web Standard Request/Response objects:

```typescript
// Convert AdonisJS Request → Web Request
export async function toWebRequest(request: HttpContext["request"]): Promise<Request>

// Convert Web Response → AdonisJS Response
export async function fromWebResponse(webResponse: Response, adonisResponse: HttpContext["response"])
```

This approach:
- Follows Better Auth documentation patterns
- Eliminates unnecessary controller abstraction
- Simplifies debugging and maintenance
- Properly handles all HTTP methods (GET, POST, etc.)

### Environment Variables

**Backend** (`apps/backend/.env`):
```bash
# Database
DB_CONNECTION=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=adonis_db

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3333

# OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

**Frontend** (`apps/web/.env`):
```bash
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_API_URL=http://localhost:3333
```

## Development Proxy Setup

### Why We Need a Proxy

In development, the frontend (`:3000`) and backend (`:3333`) run on **different ports**, which are considered **different origins** by the browser. This causes issues with cookies:

- 🚫 Cookies with `sameSite: 'lax'` don't work cross-origin
- 🚫 `sameSite: 'none'` requires HTTPS (impractical for local dev)
- ✅ **Solution**: Proxy `/api/auth` requests to backend (same-origin)

### Nuxt Proxy Configuration

**File:** `apps/web/server/api/auth/[...].ts`

We use a Nuxt server route to proxy all authentication requests to the backend:

```typescript
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiUrl || 'http://localhost:3333';

  // Get the path after /api/auth
  const path = event.path.replace('/api/auth', '');
  const targetUrl = `${backendUrl}/api/auth${path}`;

  // Forward the request with body, headers, and cookies
  const response = await $fetch.raw(targetUrl, {
    method: event.method,
    headers: getHeaders(event),
    body: await readBody(event),
    ignoreResponseError: true,
  });

  // Forward response headers (especially Set-Cookie)
  for (const [key, value] of Object.entries(response.headers)) {
    setHeader(event, key, value);
  }

  return response._data;
});
```

**How it works:**

```
Browser Request:  http://localhost:3000/api/auth/sign-in/email
                           ↓
Nuxt Dev Proxy:   http://localhost:3333/api/auth/sign-in/email
                           ↓
Backend handles:  POST /api/auth/sign-in/email
                           ↓
Sets cookie on:   localhost:3000 (same origin as browser!)
```

## Usage

### Frontend Composable

**File:** `apps/web/app/composables/useAuth.ts`

```typescript
export const useAuth = () => {
  const user = useState<User | null>('auth:user', () => null);
  const loading = useState<boolean>('auth:loading', () => false);

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (!result.error) {
      await fetchUser();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const register = async (data) => {
    const result = await signUp.email(data);
    if (!result.error) {
      await fetchUser();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const logout = async () => {
    await signOut();
    user.value = null;
    await navigateTo('/');
  };

  const fetchUser = async () => {
    const session = await getSession();
    user.value = session?.user || null;
  };

  const isAuthenticated = computed(() => !!user.value);

  return {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    isAuthenticated,
  };
};
```

### Login Page Example

```vue
<script setup lang="ts">
const { login } = useAuth();
const router = useRouter();

async function onSubmit(data: { email: string; password: string }) {
  const result = await login(data.email, data.password);

  if (result.success) {
    router.push('/dashboard');
  } else {
    // Show error
  }
}
</script>
```

### Protected Routes

**File:** `apps/web/app/middleware/auth.ts`

```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { fetchUser, isAuthenticated } = useAuth();

  // Try to fetch user if not already authenticated
  if (!isAuthenticated.value) {
    await fetchUser();
  }

  // Redirect to login if still not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }
});
```

Apply to pages:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});
</script>
```

## API Endpoints

All authentication endpoints are handled by Better Auth:

### Email/Password Authentication

- **POST** `/api/auth/sign-up/email` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }
  ```

- **POST** `/api/auth/sign-in/email` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- **POST** `/api/auth/sign-out` - Logout user

- **GET** `/api/auth/get-session` - Get current session

### OAuth Authentication

- **POST** `/api/auth/sign-in/social` - Initiate OAuth flow
  ```json
  {
    "provider": "google" // or "github"
  }
  ```

- **GET** `/api/auth/callback/google` - Google OAuth callback
- **GET** `/api/auth/callback/github` - GitHub OAuth callback

## Cookie Management

### Cookie Names

Better Auth uses these cookies (with `better_auth.` prefix):

- `better_auth.session_token` - Main session token
- `better_auth.session_data` - Cached session data (if enabled)
- `better_auth.dont_remember` - Remember me flag

### Cookie Attributes

**Development:**
```
HttpOnly: true
SameSite: Lax
Secure: false
Path: /
Domain: localhost
```

**Production:**
```
HttpOnly: true
SameSite: Lax
Secure: true
Path: /
Domain: yourdomain.com
```

## Testing

### Manual Testing

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/sign-up/email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/sign-in/email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt
   ```

3. **Get session:**
   ```bash
   curl http://localhost:3000/api/auth/get-session \
     -b cookies.txt
   ```

### Check Database

```bash
# List all users
docker exec -i saas-postgres psql -U postgres -d adonis_db \
  -c 'SELECT id, email, name, "emailVerified" FROM "user";'

# List all sessions
docker exec -i saas-postgres psql -U postgres -d adonis_db \
  -c 'SELECT id, "userId", "expiresAt" FROM "session";'
```

### Browser DevTools

1. **Check Cookies:**
   - Open DevTools → Application → Cookies → `http://localhost:3000`
   - Look for `better_auth.session_token`

2. **Check Network:**
   - Network tab → Filter by `/api/auth`
   - Check Response Headers for `Set-Cookie`

3. **Check Console:**
   - Look for Better Auth debug logs (if enabled)

## Production Deployment

### Environment Setup

1. **Generate a secure secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variables:**
   ```bash
   BETTER_AUTH_SECRET=<generated-secret>
   BETTER_AUTH_URL=https://api.yourdomain.com
   NUXT_PUBLIC_API_URL=https://api.yourdomain.com
   NUXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

3. **Enable secure cookies:**
   - Automatically enabled when `NODE_ENV=production`

### OAuth Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://api.yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `https://api.yourdomain.com/api/auth/callback/github`
4. Copy Client ID and generate Client Secret
5. Add them to `.env`

### Database Migration

Run migrations on production database:

```bash
cd apps/backend
node ace migration:run
```

### Reverse Proxy (Nginx)

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy auth requests to backend
    location /api/auth {
        proxy_pass http://localhost:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend (if needed for other API routes)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Cookies Not Being Set

**Symptoms:**
- Login succeeds but redirects back to login page
- Session returns `null` after successful authentication

**Solutions:**

1. **Check proxy server route exists** (development):
   - File should exist: `apps/web/server/api/auth/[...].ts`
   - Restart Nuxt dev server after creating/modifying
   - Test proxy: `curl http://localhost:3000/api/auth/get-session`

2. **Check cookies in DevTools:**
   - Application → Cookies → `http://localhost:3000`
   - Should see `better_auth.session_token`

3. **Check CORS** (if not using proxy):
   ```typescript
   // apps/backend/config/cors.ts
   credentials: true,
   origin: true, // or specific origins
   ```

### Database Connection Errors

**Error:** `Failed to initialize database adapter`

**Solution:**
- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Check connection details in `.env`
- Verify tables exist: See Database Schema section above

### Column Name Errors

**Error:** `column "email_verified" does not exist`

**Solution:**
Better Auth uses **camelCase** column names. Ensure your migrations use:
- `emailVerified` not `email_verified`
- `createdAt` not `created_at`
- `userId` not `user_id`

### Session Expires Immediately

**Symptoms:**
- User gets logged out on page refresh
- Session cookie disappears

**Solutions:**

1. **Check cookie expiry:**
   ```typescript
   session: {
     expiresIn: 60 * 60 * 24 * 7, // 7 days
   }
   ```

2. **Check secure cookies setting:**
   ```typescript
   advanced: {
     useSecureCookies: env.get("NODE_ENV") === "production",
   }
   ```
   Should be `false` in development (no HTTPS)

### OAuth Not Working

**Error:** `Invalid redirect URI`

**Solution:**
- Ensure redirect URI in OAuth provider matches exactly
- Development: `http://localhost:3333/api/auth/callback/google`
- Production: `https://api.yourdomain.com/api/auth/callback/google`

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs/introduction)
- [Better Auth PostgreSQL Adapter](https://www.better-auth.com/docs/adapters/postgresql)
- [Better Auth Cookies](https://www.better-auth.com/docs/concepts/cookies)
- [Nuxt Proxy Configuration](https://nuxt.com/docs/api/nuxt-config#devproxy)

## Migration from Custom Auth

If migrating from the previous custom authentication system:

1. Users table structure is compatible (just rename columns to camelCase)
2. Passwords need to be re-hashed (Better Auth uses different hashing)
3. Sessions are managed differently (cookie-based vs custom)
4. Update all `useAuth()` calls to use new methods

See `BETTER_AUTH_INTEGRATION.md` for detailed migration steps.

