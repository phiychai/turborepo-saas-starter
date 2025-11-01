/**
 * Auth Plugin
 *
 * Initializes authentication state on app load
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  // Only fetch user if not already initialized
  if (!authStore.initialized) {
    await authStore.fetchUser();
  }
});
