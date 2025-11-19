/**
 * Store state interfaces
 * Extracted from Pinia store files for better organization
 */
import type {
  Plan,
  Subscription,
  Invoice,
  UserProfile,
} from '@turborepo-saas-starter/shared-types';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
}

export type { Plan, Subscription, Invoice };

export interface BillingState {
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  currentSubscription: Subscription | null;
  loading: boolean;
  plansLoading: boolean;
  subscriptionsLoading: boolean;
  invoicesLoading: boolean;
}

// UI Store
export interface UINotification {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timeout?: number;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: UINotification[];
  commandPaletteOpen: boolean;
  searchOpen: boolean;
}

// User Store
export interface UserPreferences {
  emailNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
}

export interface UserState {
  preferences: UserPreferences | null;
  loading: boolean;
}
