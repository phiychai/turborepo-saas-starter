import type { ParsedContent } from '@nuxt/content';
import type { Avatar, Badge, Link } from '#ui/types';
import type { AvatarProps } from '@nuxt/ui';

export interface BlogPost extends ParsedContent {
  title: string;
  description: string;
  date: string;
  image?: HTMLImageElement;
  badge?: Badge;
  authors?: ({
    name: string;
    description?: string;
    avatar: Avatar;
  } & Link)[];
}

/**
 * User Profile DTO - Merged data from Adonis User + Better Auth
 * This matches the backend UserProfileDTO
 */
export interface UserProfile {
  // Profile data (from Adonis User - canonical)
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  displayName: string;

  // Authorization (from Adonis User)
  role: 'user' | 'admin';
  isActive: boolean;

  // Preferences (from Adonis User)
  preferences: Record<string, any> | null;

  // Timestamps
  createdAt: string;
  updatedAt: string | null;

  // Auth metadata (from Better Auth)
  auth: {
    provider: string | null; // 'email', 'google', 'github', etc.
    mfaEnabled: boolean;
    emailVerified: boolean;
    tokenExpiresAt: string | null;
  };
}

/**
 * Legacy User type (for backward compatibility)
 * @deprecated Use UserProfile instead
 */
export interface User extends UserProfile {}

// Dashboard types
export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced';
export type SaleStatus = 'paid' | 'failed' | 'refunded';

export interface DashboardUser {
  id: number;
  name: string;
  email: string;
  avatar?: AvatarProps;
  status: UserStatus;
  location: string;
}

export interface Mail {
  id: number;
  unread?: boolean;
  from: DashboardUser;
  subject: string;
  body: string;
  date: string;
}

export interface Member {
  name: string;
  username: string;
  role: 'member' | 'owner';
  avatar: AvatarProps;
}

export interface Stat {
  title: string;
  icon: string;
  value: number | string;
  variation: number;
  formatter?: (value: number) => string;
}

export interface Sale {
  id: string;
  date: string;
  status: SaleStatus;
  email: string;
  amount: number;
}

export interface Notification {
  id: number;
  unread?: boolean;
  sender: DashboardUser;
  body: string;
  date: string;
}

export type Period = 'daily' | 'weekly' | 'monthly';

export interface Range {
  start: Date;
  end: Date;
}
