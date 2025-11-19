import { defineStore } from 'pinia';
import type { UINotification, UIState } from '~/types/stores';

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    sidebarCollapsed: false,
    theme: 'system',
    notifications: [],
    commandPaletteOpen: false,
    searchOpen: false,
  }),

  getters: {
    isSidebarCollapsed: (state) => state.sidebarCollapsed,
    currentTheme: (state) => state.theme,
    unreadNotifications: (state) => state.notifications.length,
  },

  actions: {
    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    /**
     * Set sidebar state explicitly
     */
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
    },

    /**
     * Set theme
     */
    setTheme(theme: 'light' | 'dark' | 'system') {
      this.theme = theme;

      // Update color mode
      if (import.meta.client) {
        const colorMode = useColorMode();
        colorMode.preference = theme;
      }
    },

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
      const newTheme = this.theme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
    },

    /**
     * Add notification
     */
    addNotification(notification: Omit<UINotification, 'id'>) {
      const id = `notif-${Date.now()}-${Math.random()}`;
      const newNotification = {
        id,
        ...notification,
      };

      this.notifications.push(newNotification);

      // Auto-remove after timeout
      if (notification.timeout !== 0) {
        const timeout = notification.timeout || 5000;
        setTimeout(() => {
          this.removeNotification(id);
        }, timeout);
      }

      return id;
    },

    /**
     * Remove notification by ID
     */
    removeNotification(id: string) {
      const index = this.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },

    /**
     * Clear all notifications
     */
    clearNotifications() {
      this.notifications = [];
    },

    /**
     * Toggle command palette
     */
    toggleCommandPalette() {
      this.commandPaletteOpen = !this.commandPaletteOpen;
    },

    /**
     * Open command palette
     */
    openCommandPalette() {
      this.commandPaletteOpen = true;
    },

    /**
     * Close command palette
     */
    closeCommandPalette() {
      this.commandPaletteOpen = false;
    },

    /**
     * Toggle search
     */
    toggleSearch() {
      this.searchOpen = !this.searchOpen;
    },

    /**
     * Open search
     */
    openSearch() {
      this.searchOpen = true;
    },

    /**
     * Close search
     */
    closeSearch() {
      this.searchOpen = false;
    },
  },

  // Persist UI preferences
  persist: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: ['sidebarCollapsed', 'theme'],
  } as any,
});
