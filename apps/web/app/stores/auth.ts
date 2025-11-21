import { defineStore } from 'pinia';
import { signIn, signUp, signOut } from '~/lib/auth-client';
import type { UserProfile } from '@turborepo-saas-starter/shared-types';
import type { AuthState } from '~/types/stores';

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
      } catch (error: unknown) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Login with username and password (Better Auth Username Plugin)
     */
    async loginWithUsername(username: string, password: string) {
      this.loading = true;

      try {
        const result = await signIn.username({ username, password });

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
      } catch (error: unknown) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Register a new user
     */
    async register(data: {
      email: string;
      password: string;
      fullName?: string;
      username?: string;
    }) {
      this.loading = true;

      try {
        // Build signUp data, only including optional fields if they have values
        const signUpData = {
          email: data.email,
          password: data.password,
          ...(data.fullName && { name: data.fullName }),
          ...(data.username && { username: data.username }),
        };

        const result = await signUp.email(signUpData as Parameters<typeof signUp.email>[0]);

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
      } catch (error: unknown) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
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
      } catch (error: unknown) {
        console.error('Logout error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Logout failed',
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
      } catch (error: unknown) {
        // Silently handle 401/403 - user is not authenticated (expected)
        // Don't log to console as this is normal when user is not logged in
        const statusCode =
          error && typeof error === 'object' && 'statusCode' in error
            ? (error as { statusCode: number }).statusCode
            : undefined;
        if (statusCode === 401 || statusCode === 403) {
          this.user = null;
          this.initialized = true;
        } else {
          // Log other errors (network issues, server errors, etc.)
          console.error('Fetch user error:', error);
          // Keep existing user if available (might be transient error)
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
     * Handles name (split into firstName/lastName), email, username, bio, and avatarUrl
     * Email and username updates are synced to Better Auth automatically by the backend
     */
    async updateProfile(data: Partial<UserProfile & { name?: string }>) {
      this.loading = true;

      try {
        // Use useRequestFetch for SSR cookie forwarding
        const requestFetch = useRequestFetch();

        // Prepare profile data - backend will handle name splitting
        const profileData: any = {};

        // Include name field (will be split on backend)
        if (data.name !== undefined) {
          profileData.name = data.name;
        }

        // Include other fields
        if (data.email !== undefined) {
          profileData.email = data.email;
        }
        if (data.username !== undefined) {
          profileData.username = data.username;
        }
        if (data.bio !== undefined) {
          profileData.bio = data.bio;
        }
        if (data.avatarUrl !== undefined) {
          profileData.avatarUrl = data.avatarUrl;
        }
        if (data.firstName !== undefined) {
          profileData.firstName = data.firstName;
        }
        if (data.lastName !== undefined) {
          profileData.lastName = data.lastName;
        }

        const response = await requestFetch<{ user: UserProfile }>('/api/user/me', {
          method: 'PATCH',
          body: profileData,
          credentials: 'include',
        });

        // Update local state
        if (this.user && response.user) {
          this.user = { ...this.user, ...response.user };
        }

        return {
          success: true,
          user: this.user,
        };
      } catch (error: unknown) {
        console.error('Update profile error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Update failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update username (Better Auth Username Plugin)
     */
    async updateUsername(username: string) {
      this.loading = true;

      try {
        const { authClient } = await import('~/lib/auth-client');
        const result = await authClient.updateUser({ username });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || 'Username update failed',
          };
        }

        // Fetch updated user data
        await this.fetchUser();

        return {
          success: true,
          user: this.user,
        };
      } catch (error: unknown) {
        console.error('Update username error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Username update failed',
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
      } catch (error: unknown) {
        console.error('Change password error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Password change failed',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Request password reset OTP
     */
    async requestPasswordReset(email: string) {
      this.loading = true;

      try {
        const { authClient } = await import('~/lib/auth-client');
        const result = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: 'forget-password',
        });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || 'Failed to send password reset code',
          };
        }

        return { success: true };
      } catch (error: unknown) {
        console.error('Request password reset error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send password reset code',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Reset password with OTP
     */
    async resetPassword(email: string, otp: string, newPassword: string) {
      this.loading = true;

      try {
        const { authClient } = await import('~/lib/auth-client');
        const result = await authClient.emailOtp.resetPassword({
          email,
          otp,
          password: newPassword,
        });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || 'Password reset failed',
          };
        }

        return { success: true };
      } catch (error: unknown) {
        console.error('Reset password error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Password reset failed',
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
      if (import.meta.client && typeof window !== 'undefined') {
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
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['user'], // Only persist user data, not loading states
  } as any,
});
