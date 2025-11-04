/**
 * Auth Plugin
 *
 * Initializes authentication state on app load
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  // Only fetch user if not already initialized
  if (!authStore.initialized) {
    // Fetch user - will handle 401 gracefully if not logged in
    await authStore.fetchUser();
  }
});
