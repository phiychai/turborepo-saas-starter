export default defineNuxtRouteMiddleware(async (to, from) => {
  const { fetchUser, isAuthenticated } = useAuth();

  // Try to fetch user if not already authenticated
  if (!isAuthenticated.value) {
    await fetchUser();
  }

  // Redirect to login if still not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }
});
