import { defineStore } from 'pinia';
import { signIn, signUp, signOut, getSession } from '~/lib/auth-client';
import type { User } from '~/types';

export interface AuthState {
  user: User | null;
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
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading,
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
          name: data.fullName,
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
        this.user = null;
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
     * Fetch current user session
     */
    async fetchUser() {
      this.loading = true;

      try {
        const session = await getSession();

        // Better Auth returns user in session.user or session.data.user
        const userData = session?.user || session?.data?.user;

        if (userData) {
          this.user = userData as any;
          this.initialized = true;
          return {
            success: true,
            user: this.user,
          };
        }

        this.user = null;
        this.initialized = true;
        return {
          success: false,
          user: null,
        };
      } catch (error: any) {
        console.error('Fetch user error:', error);
        this.user = null;
        this.initialized = true;
        return {
          success: false,
          user: null,
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>) {
      this.loading = true;

      try {
        const { $fetch } = useNuxtApp();

        const response = await $fetch('/api/user/profile', {
          method: 'PATCH',
          body: data,
        });

        if (this.user) {
          this.user = { ...this.user, ...response };
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
        const { $fetch } = useNuxtApp();

        await $fetch('/api/auth/change-password', {
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
    },
  },

  // Enable persistence (optional, but recommended)
  persist: {
    storage: persistedState.localStorage,
    paths: ['user'], // Only persist user data, not loading states
  },
});
