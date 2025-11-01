/**
 * Admin Middleware
 *
 * Protects admin routes - only accessible to users with admin role
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    });
  }

  // Check if user has admin role
  if (authStore.user?.role !== 'admin') {
    // Not an admin - redirect to regular dashboard
    return navigateTo('/dashboard');
  }

  // User is admin - allow access
});
