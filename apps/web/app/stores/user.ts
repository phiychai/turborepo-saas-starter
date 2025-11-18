import { defineStore } from 'pinia';
import type { UserPreferences, UserState } from '~/types/stores';

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    preferences: null,
    loading: false,
  }),

  getters: {
    userPreferences: (state) => state.preferences,
    isLoading: (state) => state.loading,
  },

  actions: {
    /**
     * Fetch user preferences
     */
    async fetchPreferences() {
      this.loading = true;

      try {
        const { $fetch } = useNuxtApp();

        const preferences = await $fetch('/api/user/preferences');
        this.preferences = preferences as UserPreferences;

        return {
          success: true,
          preferences: this.preferences,
        };
      } catch (error: unknown) {
        console.error('Fetch preferences error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch preferences',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update user preferences
     */
    async updatePreferences(updates: Partial<UserPreferences>) {
      this.loading = true;

      try {
        const { $fetch } = useNuxtApp();

        const preferences = await $fetch('/api/user/preferences', {
          method: 'PATCH',
          body: updates,
        });

        this.preferences = preferences as UserPreferences;

        return {
          success: true,
          preferences: this.preferences,
        };
      } catch (error: unknown) {
        console.error('Update preferences error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update preferences',
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear user data (for logout)
     */
    clearUserData() {
      this.preferences = null;
    },
  },

  // Persist preferences
  persist: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['preferences'],
  },
});
