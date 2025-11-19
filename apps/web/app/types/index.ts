import type { ParsedContentv2 } from '@nuxt/content';
import type { BadgeProps, LinkProps, AvatarProps } from '#ui/types';
import type { UserProfile } from '@turborepo-saas-starter/shared-types';

// Re-export types from organized type files
export type * from './components';
export type * from './stores';
export type * from './composables';

export interface BlogPost extends ParsedContentv2 {
  title: string;
  description: string;
  date: string;
  image?: string;
  badge?: BadgeProps;
  authors?: ({
    name: string;
    description?: string;
    avatar: AvatarProps;
  } & LinkProps)[];
}

/**
 * Legacy User type (for backward compatibility)
 * @deprecated Use UserProfile from @turborepo-saas-starter/shared-types instead
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
  role?: 'user' | 'admin';
  isActive?: boolean;
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

// Dashboard Notification (different from UI store Notification)
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
