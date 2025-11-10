// plugins/auth.server.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  // This runs on server before render, so auth state is ready immediately
  if (!authStore.initialized) {
    await authStore.fetchUser(); // useRequestFetch works in SSR
  }
});
