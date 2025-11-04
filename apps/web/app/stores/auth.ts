import { defineStore } from 'pinia';
import { signIn, signUp, signOut } from '~/lib/auth-client';
import type { UserProfile } from '~/types';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && state.user.isActive,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading,
    isAdmin: (state) => state.user?.role === 'admin',
    // Auth metadata getters
    authProvider: (state) => state.user?.auth?.provider || null,
    isEmailVerified: (state) => state.user?.auth?.emailVerified || false,
    isMfaEnabled: (state) => state.user?.auth?.mfaEnabled || false,
  },

  actions: {
    /**
     * Login with email and password
     */
    async login(email: string, password: string) {
      this.loading = true;

      try {
        const result = await signIn.email({ email, password });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || 'Login failed',
          };
        }

        // Fetch user data after successful login
        await this.fetchUser();

        return {
          success: true,
          user: this.user,
        };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error.message || 'Login failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Register a new user
     */
    async register(data: { email: string; password: string; fullName?: string }) {
      this.loading = true;

      try {
        const result = await signUp.email({
          email: data.email,
          password: data.password,
          name: data.fullName || undefined,
        });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || 'Registration failed',
          };
        }

        // Fetch user data after successful registration
        await this.fetchUser();

        return {
          success: true,
          user: this.user,
        };
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error.message || 'Registration failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout current user
     */
    async logout() {
      this.loading = true;

      try {
        await signOut();
        this.clearAuth();
        await navigateTo('/');

        return { success: true };
      } catch (error: any) {
        console.error('Logout error:', error);
        return {
          success: false,
          error: error.message || 'Logout failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch current user profile from /me endpoint
     * This returns merged data from Adonis + Better Auth
     */
    async fetchUser() {
      this.loading = true;

      try {
        // Use useRequestFetch for SSR cookie forwarding, $fetch for client
        // See: https://nuxt.com/docs/4.x/api/utils/dollarfetch#passing-headers-and-cookies
        const requestFetch = useRequestFetch();

        const profile = await requestFetch<UserProfile>('/api/user/me', {
          credentials: 'include', // Include cookies for session
        });

        this.user = profile;
        this.initialized = true;

        return {
          success: true,
          user: this.user,
        };
      } catch (error: any) {
        console.error('Fetch user error:', error);

        // If 401/403, user is not authenticated
        if (error.statusCode === 401 || error.statusCode === 403) {
          this.user = null;
          this.initialized = true;
        } else {
          // Other errors - keep existing user if available
          this.initialized = true;
        }

        return {
          success: false,
          user: this.user,
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<UserProfile>) {
      this.loading = true;

      try {
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        const response = await requestFetch<{ user: UserProfile }>('/api/user/profile', {
          method: 'PATCH',
          body: data,
        });

        // Update local state
        if (this.user && response.user) {
          this.user = { ...this.user, ...response.user };
        }

        return {
          success: true,
          user: this.user,
        };
      } catch (error: any) {
        console.error('Update profile error:', error);
        return {
          success: false,
          error: error.message || 'Update failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Change password
     */
    async changePassword(oldPassword: string, newPassword: string) {
      this.loading = true;

      try {
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        await requestFetch('/api/auth/change-password', {
          method: 'POST',
          body: { oldPassword, newPassword },
        });

        return { success: true };
      } catch (error: any) {
        console.error('Change password error:', error);
        return {
          success: false,
          error: error.message || 'Password change failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear auth state (useful for logout or session expiry)
     */
    clearAuth() {
      this.user = null;
      this.initialized = false;

      // Explicitly clear persisted state from localStorage
      // pinia-plugin-persistedstate uses store ID as key (usually 'auth')
      if (process.client && typeof window !== 'undefined') {
        try {
          // Clear common localStorage key formats for this store
          const keysToRemove = ['auth', 'pinia-auth', 'pinia/auth'];
          keysToRemove.forEach((key) => {
            localStorage.removeItem(key);
          });

          // Also check for exact match keys that might be used by the plugin
          // The plugin typically uses just the store ID as the key
          const storeId = 'auth';
          if (localStorage.getItem(storeId)) {
            localStorage.removeItem(storeId);
          }
        } catch (error) {
          console.error('Failed to clear auth from localStorage:', error);
        }
      }
    },
  },

  // Enable persistence (optional, but recommended)
  persist: {
    storage: persistedState.localStorage,
    paths: ['user'], // Only persist user data, not loading states
  },
});
