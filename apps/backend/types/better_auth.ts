/**
 * Better Auth hook type definitions
 * These types define the structure of Better Auth hook parameters
 */

import type { BetterAuthUser } from '#services/user_sync_service';

/**
 * Better Auth account object (for OAuth providers)
 */
export interface BetterAuthAccount {
  id?: string;
  providerId?: string;
  accountId?: string;
  request?: BetterAuthRequest;
  [key: string]: unknown;
}

/**
 * Better Auth request object (from hooks)
 */
export interface BetterAuthRequest {
  headers?: {
    get?: (name: string) => string | null;
  };
  url?: string;
  [key: string]: unknown;
}

/**
 * Better Auth hook input for sign-up
 */
export interface BetterAuthSignUpInput {
  email?: string;
  password?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
}

/**
 * Better Auth hook input for password update
 */
export interface BetterAuthPasswordUpdateInput {
  newPassword?: string;
  oldPassword?: string;
  [key: string]: unknown;
}

/**
 * Better Auth hook context for beforeSignUp
 */
export interface BetterAuthBeforeSignUpContext {
  input: BetterAuthSignUpInput;
  [key: string]: unknown;
}

/**
 * Better Auth hook context for beforePasswordUpdate
 */
export interface BetterAuthBeforePasswordUpdateContext {
  input: BetterAuthPasswordUpdateInput;
  [key: string]: unknown;
}

/**
 * Better Auth hook context for onAfterSignUp
 */
export interface BetterAuthAfterSignUpContext {
  user: BetterAuthUser;
  account?: BetterAuthAccount;
  [key: string]: unknown;
}

/**
 * Better Auth hook context for onAfterSignIn
 */
export interface BetterAuthAfterSignInContext {
  user: BetterAuthUser;
  account?: BetterAuthAccount;
  [key: string]: unknown;
}

/**
 * Better Auth hook context for afterFailedSignIn
 */
export interface BetterAuthAfterFailedSignInContext {
  user: BetterAuthUser;
  account?: BetterAuthAccount;
  [key: string]: unknown;
}

/**
 * Better Auth hook context for beforeSignIn
 */
export interface BetterAuthBeforeSignInContext {
  user: BetterAuthUser;
  [key: string]: unknown;
}

/**
 * Better Auth API interface (partial - Better Auth may not export full types)
 */
export interface BetterAuthApi {
  updateUser?: (options: {
    body: {
      name?: string;
      image?: string;
      username?: string;
      [key: string]: unknown;
    };
    headers?: Headers | Record<string, string>;
  }) => Promise<{ user?: BetterAuthUser }>;
  listUserSessions?: (options: {
    body: { userId: string };
    headers?: Headers | Record<string, string>;
  }) => Promise<{ sessions?: unknown[] }>;
  revokeUserSession?: (options: {
    body: { sessionToken: string };
    headers?: Headers | Record<string, string>;
  }) => Promise<void>;
  revokeUserSessions?: (options: {
    body: { userId: string };
    headers?: Headers | Record<string, string>;
  }) => Promise<void>;
  [key: string]: unknown;
}

/**
 * Better Auth instance type (partial)
 */
export interface BetterAuthInstance {
  api?: BetterAuthApi;
  handler?: (request: Request) => Promise<Response>;
  [key: string]: unknown;
}

