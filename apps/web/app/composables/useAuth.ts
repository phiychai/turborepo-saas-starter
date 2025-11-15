import { useAuthStore } from '~/stores/auth';
import { useUserStore } from '~/stores/user';
import { useBillingStore } from '~/stores/billing';
import { useUIStore } from '~/stores/ui';

/**
 * useAuth Composable
 *
 * This is a wrapper around the Pinia auth store for backward compatibility.
 * It provides the same API as before, but now uses Pinia for state management.
 *
 * For new code, prefer using `useAuthStore()` directly.
 */
export const useAuth = () => {
  const authStore = useAuthStore();

  // Create computed refs that match the old API
  const user = computed(() => authStore.user);
  const loading = computed(() => authStore.loading);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isAdmin = computed(() => authStore.isAdmin);

  // Auth metadata
  const authProvider = computed(() => authStore.authProvider);
  const isEmailVerified = computed(() => authStore.isEmailVerified);
  const isMfaEnabled = computed(() => authStore.isMfaEnabled);

  return {
    // State (as computed refs for reactivity)
    user,
    loading,
    isAuthenticated,
    isAdmin,

    // Auth metadata
    authProvider,
    isEmailVerified,
    isMfaEnabled,

    // Actions (direct references to store actions)
    login: authStore.login,
    loginWithUsername: authStore.loginWithUsername,
    register: authStore.register,
    logout: authStore.logout,
    fetchUser: authStore.fetchUser,
    updateProfile: authStore.updateProfile,
    updateUsername: authStore.updateUsername,
    changePassword: authStore.changePassword,
  };
};

/**
 * Convenience composable to access all stores
 */
export const useStores = () => ({
  auth: useAuthStore(),
  user: useUserStore(),
  billing: useBillingStore(),
  ui: useUIStore(),
});
