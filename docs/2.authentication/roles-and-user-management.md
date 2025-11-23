---
title: 'Roles and User Management'
description: 'Complete guide to the role-based user management system with 6 roles, Directus integration, and email synchronization'
navigation:
  title: 'Roles & User Management'
  order: 3
---

## Overview

The system implements a comprehensive role-based user management system with 6 distinct roles, automatic Directus synchronization for content roles, and email change synchronization across all systems.

## Role System

### Available Roles

The system supports 6 roles:

1. **`user`** (General User)
   - Default role for frontend registrations
   - No Directus user created
   - Basic application access

2. **`admin`** (Administrator)
   - Full system access
   - Can manage all users
   - Directus role: Administrator
   - Better Auth role: `admin`

3. **`content_admin`** (Content Admin)
   - Full content management rights
   - Directus role: Content Admin
   - Better Auth role: `user`

4. **`editor`** (Editor)
   - Can edit and publish all content
   - Directus role: Editor
   - Better Auth role: `user`

5. **`writer`** (Writer)
   - Can create posts and edit own posts
   - Directus role: Writer
   - Better Auth role: `user`
   - **Automatic space creation**: A default space is created using the user's first name (Substack-style)

### Role Mapping

#### AdonisJS → Better Auth

Better Auth uses a simplified role system (admin vs non-admin):

- `admin` → `admin` in Better Auth
- `user`, `content_admin`, `editor`, `writer` → `user` in Better Auth

**Rationale**: Better Auth Admin plugin is designed for simple admin/non-admin distinction. AdonisJS Bouncer handles complex role-based authorization.

#### AdonisJS → Directus

Directus roles are mapped as follows:

- `admin` → Directus "Administrator" role (`ef049c8b-546b-4bbc-9cd7-b05d77e58b66`)
- `content_admin` → Directus "Content Admin" role (`d70780bd-f3ed-418b-98c2-f5354fd3fa68`)
- `editor` → Directus "Editor" role (`4516009c-8a04-49e4-b4ac-fd4883da6064`)
- `writer` → Directus "Writer" role (`3a4464fb-2189-4710-a164-2503eed88ae7`)
- `user` → No Directus user created

## User Registration Flows

### Frontend Registration

When a user registers through the frontend:

```
1. User submits registration form
   ↓
2. Better Auth creates user
   ↓
3. onAfterSignUp hook fires
   ↓
4. UserSyncService.syncUser() creates Adonis user
   - Role: 'user' (default)
   - No Directus user created
   ↓
5. User can access application
```

**Result**: User with `'user'` role, no Directus access.

### Admin User Creation

When an admin creates a user through the admin panel:

```
1. Admin submits user creation form with role selection
   ↓
2. Better Auth creates user
   ↓
3. UserSyncService.syncUser() creates Adonis user with specified role
   ↓
4. Better Auth role synced (admin → 'admin', others → 'user')
   ↓
5. If role requires Directus:
   - DirectusUserSyncService creates Directus user
   - Directus role assigned based on Adonis role
   ↓
6. If role is 'writer':
   - Default space created automatically
   - Space name: "{firstName}'s Articles" (or fallback to lastName/email)
   ↓
7. User created with all systems synced
```

**Endpoint**: `POST /api/admin/users`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe", // optional
  "role": "writer" // user | admin | content_admin | editor | writer
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "writer",
    "directusUserId": "uuid-here",
    "isActive": true
  }
}
```

## Directus User Synchronization

### Automatic Creation

Directus users are automatically created when:

1. Admin creates a user with a content role (`admin`, `content_admin`, `editor`, `writer`)
2. User role is updated to a content role

### Directus User Fields

When a Directus user is created, the following fields are synced:

- `email`: From Adonis user
- `first_name`: From Adonis user
- `last_name`: From Adonis user
- `role`: Mapped from Adonis role
- `status`: Set to `'active'`

**Note**: Directus users created this way don't have passwords. They can only be used for content management, not authentication.

### Space Creation for Writers

When a user is created or updated with the `writer` role:

1. System checks if user already has a default space
2. If not, creates a default space with:
   - `slug`: `'article'`
   - `name`: `"{firstName}'s Articles"` (or fallback to lastName/email prefix)
   - `description`: `'Default space for general articles'`
   - `is_default`: `true`
   - `owner`: Directus user ID

**Example**:
- User: John Doe (`firstName: "John"`)
- Space created: "John's Articles"

## Email Change Synchronization

### Flow: Better Auth → Adonis → Directus

Email changes should flow **one-way** from Better Auth to Adonis to Directus:

```
1. User initiates email change via Better Auth
   (Better Auth handles verification)
   ↓
2. After Better Auth email is verified and updated
   ↓
3. EmailSyncService.syncEmailFromBetterAuth() called
   ↓
4. Email updated in Adonis (canonical)
   ↓
5. Email updated in Directus (if Directus user exists)
```

### Implementation

**Better Auth Email Change**:
- Users should use Better Auth's email change flow which includes verification
- After verification, hook into Better Auth's email change event
- Call `EmailSyncService.syncEmailFromBetterAuth()` to sync to Adonis and Directus

**Admin Email Updates**:
- Admin can update email via `PATCH /api/admin/users/:id`
- Email is synced to Directus automatically
- Better Auth email should be updated separately via Better Auth's flow

**User Profile Email Updates**:
- Email updates via `PATCH /api/user/me` sync to Adonis and Directus
- Better Auth email should be updated separately via Better Auth's flow

## Role Updates

### Updating User Roles

**Endpoint**: `PATCH /api/admin/users/:id`

**Request Body**:
```json
{
  "role": "editor"
}
```

**What Happens**:

1. Adonis user role updated (canonical)
2. Better Auth role synced:
   - If `role === 'admin'` → Better Auth role set to `'admin'`
   - Otherwise → Better Auth role set to `'user'`
3. Directus role handling:
   - If role changed to content role → Create/update Directus user
   - If role changed from content role to `'user'` → Directus user remains (not deleted)
   - If role changed between content roles → Update Directus role

### Role Change Examples

**Example 1: User → Writer**
```
1. Adonis role: 'user' → 'writer'
2. Better Auth role: 'user' → 'user' (no change)
3. Directus: No user → Create user with Writer role
4. Space: Create default space
```

**Example 2: Writer → Editor**
```
1. Adonis role: 'writer' → 'editor'
2. Better Auth role: 'user' → 'user' (no change)
3. Directus: Update role from Writer to Editor
4. Space: Keep existing space (no change)
```

**Example 3: Editor → User**
```
1. Adonis role: 'editor' → 'user'
2. Better Auth role: 'user' → 'user' (no change)
3. Directus: User remains (not deleted, but role may be updated)
```

## API Endpoints

### Admin User Management

#### List Users
```
GET /api/admin/users
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 25)
  - search: string (searches email, firstName, lastName, username)
  - role: string (filters by role)
  - isActive: boolean (filters by active status)
```

#### Get User
```
GET /api/admin/users/:id
```

#### Create User
```
POST /api/admin/users
Body: {
  email: string (required)
  password: string (required, min 8 chars)
  firstName: string (optional)
  lastName: string (optional)
  username: string (optional, min 3, max 30)
  role: 'user' | 'admin' | 'content_admin' | 'editor' | 'writer' (required)
}
```

#### Update User
```
PATCH /api/admin/users/:id
Body: {
  firstName?: string
  lastName?: string
  email?: string
  role?: 'user' | 'admin' | 'content_admin' | 'editor' | 'writer'
  isActive?: boolean
}
```

#### Delete User
```
DELETE /api/admin/users/:id
```

#### Toggle User Status
```
PATCH /api/admin/users/:id/toggle-status
```

## Services

### DirectusUserSyncService

**Location**: `apps/backend/app/services/directus_user_sync_service.ts`

**Key Methods**:

- `syncUserToDirectus(user: User, role: string)`: Create/update Directus user
- `createDefaultSpaceForWriter(directusUserId, firstName, lastName, email)`: Create default space for Writer
- `updateDirectusUserEmail(directusUserId, email)`: Update Directus email
- `updateDirectusUserRole(directusUserId, adonisRole)`: Update Directus role
- `getDirectusRoleId(adonisRole)`: Map Adonis role to Directus role ID
- `requiresDirectusUser(role)`: Check if role requires Directus user

### EmailSyncService

**Location**: `apps/backend/app/services/email_sync_service.ts`

**Key Methods**:

- `syncEmailFromBetterAuth(betterAuthUserId, newEmail)`: Sync email from Better Auth to Adonis and Directus
- `syncEmailToDirectus(directusUserId, email)`: Update Directus email
- `syncEmailToAdonisAndDirectus(user, newEmail)`: Sync email to Adonis and Directus (fallback)

### BetterAuthSyncService

**Location**: `apps/backend/app/services/better_auth_sync_service.ts`

**Key Methods**:

- `syncRole(adonisUserId, newRole, request)`: Sync role to Better Auth (maps to admin/user)

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  better_auth_user_id VARCHAR(255) UNIQUE,
  directus_user_id VARCHAR(255), -- UUID from Directus
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- user | admin | content_admin | editor | writer
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- ... other fields
);
```

## Best Practices

### Role Assignment

1. **Frontend Registrations**: Always default to `'user'` role
2. **Admin Creation**: Use appropriate role based on user's responsibilities
3. **Role Updates**: Consider impact on Directus access and spaces

### Email Changes

1. **User-Initiated**: Should go through Better Auth's email change flow
2. **Admin-Initiated**: Can update directly, but Better Auth email should be updated separately
3. **Verification**: Always verify email changes in Better Auth before syncing

### Directus Users

1. **Creation**: Only create for content roles
2. **Deletion**: Don't delete Directus users when role changes to `'user'` (preserve data)
3. **Updates**: Keep Directus users in sync with Adonis users

### Spaces

1. **Writer Role**: Always create default space when assigning Writer role
2. **Space Naming**: Use first name, fallback to last name, then email prefix
3. **Existing Spaces**: Don't create duplicate default spaces

## Troubleshooting

### Directus User Not Created

**Symptoms**: User has content role but no Directus user

**Solutions**:
1. Check `directus_user_id` field in users table
2. Verify Directus service is accessible
3. Check logs for Directus creation errors
4. Manually sync: Update user role to trigger sync

### Email Not Syncing

**Symptoms**: Email updated in one system but not others

**Solutions**:
1. Verify Better Auth email change completed
2. Check EmailSyncService logs
3. Manually sync email via admin panel
4. Verify Directus user exists (if applicable)

### Space Not Created for Writer

**Symptoms**: Writer role assigned but no space created

**Solutions**:
1. Check Directus user was created
2. Verify space creation logs
3. Check for existing default space
4. Manually create space if needed

## Migration Notes

When upgrading from the old 2-role system:

1. Run migration to update role enum
2. Existing `'user'` roles remain as `'user'`
3. Existing `'admin'` roles remain as `'admin'`
4. New roles can be assigned via admin panel
5. Directus users will be created on next role update to content role

