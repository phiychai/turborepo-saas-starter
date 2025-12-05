---
title: 'Authentication & Authorization Architecture'
description: 'Architecture guide: Better Auth for authentication, AdonisJS for authorization'
navigation:
  title: 'Auth Architecture'
  order: 2
---

## Overview

This application uses a clean separation between **authentication** (who you are) and **authorization** (what you can do):

- **Better Auth**: Handles authentication only (sessions, tokens, MFA, OAuth providers)
- **AdonisJS Users Table**: Canonical source of truth for ALL profile and authorization data
- **Bouncer**: Authorization policies based on Adonis User model

## Data Storage

### Better Auth (`user` table)
**Purpose**: Authentication and session management only

**Stores**:
- `id`: Unique identifier (nanoid)
- `email`: Email address (for login)
- `emailVerified`: Email verification status
- `image`: Profile image URL (from OAuth)
- `adonisUserId`: Reference to Adonis User (stored in session metadata)
- `deletedAt`: Soft delete timestamp
- Session/token data in `session` table

**Does NOT store** (canonical in AdonisJS):
- ❌ `role` - Only in AdonisJS users table
- ❌ `firstName`, `lastName`, `username` - Only in AdonisJS users table
- ❌ Preferences, app-specific fields - Only in AdonisJS users table

**Note**: Better Auth may temporarily store profile data from OAuth providers (firstName, lastName, etc.), but this is immediately synced to AdonisJS and AdonisJS is the canonical source.

### AdonisJS Users (`users` table)
**Purpose**: Canonical storage for ALL user profile and authorization data

**Stores**:
- `id`: Primary key
- `email`: Email address (canonical)
- `firstName`, `lastName`, `username`: Profile data (canonical)
- `role`: Authorization role - "user" | "admin" | "content_admin" | "editor" | "writer" (canonical)
- `isActive`: Account status
- `better_auth_user_id`: Reference to Better Auth user
- `directus_user_id`: Reference to Directus user (for content roles)
- Preferences, app-specific fields (canonical)
- `deleted_at`: Soft delete timestamp

## Session Flow

### Sign-Up Flow

```
1. User registers via Better Auth
   ↓
2. Better Auth creates user in `user` table
   ↓
3. onAfterSignUp hook fires
   ↓
4. Extract profile data from Better Auth (may come from OAuth)
   ↓
5. Upsert Adonis User in `users` table (canonical storage)
   - firstName, lastName, username, role (default: "user")
   ↓
6. Store Adonis user ID in Better Auth `user.adonisUserId`
   ↓
7. Better Auth session includes adonisUserId in metadata (via customSession plugin)
```

### Sign-In Flow

```
1. User signs in via Better Auth
   ↓
2. Better Auth validates credentials/OAuth
   ↓
3. onAfterSignIn hook fires
   ↓
4. Upsert Adonis User (sync any OAuth profile updates)
   ↓
5. Better Auth session includes adonisUserId in metadata
   ↓
6. Auth middleware loads Adonis User using adonisUserId
   ↓
7. ctx.auth.user = Adonis User (available in controllers)
```

### Request Flow

```
1. Request arrives with Better Auth session cookie
   ↓
2. Auth middleware validates Better Auth session
   ↓
3. Extracts adonisUserId from session metadata
   ↓
4. Loads Adonis User model (canonical profile/role data)
   ↓
5. Sets ctx.auth.user = Adonis User
   ↓
6. Controllers use ctx.auth.user for profile/authorization
   ↓
7. Bouncer uses ctx.auth.user for authorization checks
```

## Authorization with Bouncer

All authorization is based on **Adonis User model**, not Better Auth:

```typescript
// Abilities defined in app/abilities/main.ts
export const manageUsers = Bouncer.ability((user: User) => {
  return user.role === 'admin' // Role from Adonis User
})

// Usage in controllers
await ctx.bouncer.authorize('manageUsers', ctx.auth.user)
```

## Data Sync Strategy

### Direction: Better Auth → AdonisJS (One-Way)

Profile data flows **one-way only**: Better Auth → AdonisJS

**Why?**
- Better Auth may receive profile updates from OAuth providers
- AdonisJS is the canonical source for all profile data
- Updates made in AdonisJS don't need to sync back to Better Auth (Better Auth only needs auth data)

**When profile data syncs:**
- `onAfterSignUp`: Initial profile from Better Auth → AdonisJS
- `onAfterSignIn`: Sync OAuth profile updates → AdonisJS
- `onAfterUpdateUser`: Sync Better Auth profile updates → AdonisJS

**What syncs:**
- ✅ `firstName`, `lastName` (from OAuth providers)
- ✅ `username` (if provided)
- ✅ `role` - Synced to Better Auth (mapped to admin/user) and Directus (for content roles)
- ✅ `email` - Synced from Better Auth to Adonis and Directus (one-way flow)

## Benefits

1. **Single Source of Truth**: All profile/authorization data in AdonisJS
2. **Better Auth Upgrades**: Can upgrade Better Auth without affecting authorization model
3. **Flexibility**: Easy to add app-specific fields to AdonisJS users table
4. **OAuth Compatibility**: OAuth profile data automatically syncs to canonical storage
5. **Clear Separation**: Authentication (Better Auth) vs Authorization (AdonisJS + Bouncer)

## Migration Path

If migrating from an existing setup:

1. Run migration to remove `role` from Better Auth `user` table
2. Ensure all Better Auth users have corresponding AdonisJS users
3. Update controllers to use `ctx.auth.user` instead of Better Auth user
4. Replace manual role checks with Bouncer abilities

## Key Files

- `apps/backend/config/better_auth.ts`: Better Auth config with hooks
- `apps/backend/app/middleware/auth_middleware.ts`: Loads Adonis User from session
- `apps/backend/app/abilities/main.ts`: Bouncer abilities based on Adonis User
- `apps/backend/app/models/user.ts`: Adonis User model (canonical)

