import type { User } from '~/types';

export const useAuth = () => {
  const user = useState<User | null>('auth:user', () => null);
  const loading = useState<boolean>('auth:loading', () => false);
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl || 'http://localhost:3333';

  /**
   * Login user
   */
  const login = async (email: string, password: string) => {
    loading.value = true;
    try {
      const response = await $fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      });

      if (response.user) {
        user.value = response.user;
      }

      return { success: true, user: response.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Login failed',
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Register new user
   */
  const register = async (data: { email: string; password: string; fullName?: string }) => {
    loading.value = true;
    try {
      const response = await $fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        body: data,
        credentials: 'include',
      });

      return { success: true, user: response.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Registration failed',
        errors: error.data?.errors,
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    loading.value = true;
    try {
      await $fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      user.value = null;

      // Redirect to home
      await navigateTo('/');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Logout failed',
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get current authenticated user
   */
  const fetchUser = async () => {
    loading.value = true;
    try {
      const response = await $fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include',
      });

      user.value = response.user;
      return { success: true, user: response.user };
    } catch (error) {
      user.value = null;
      return { success: false, user: null };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: { fullName?: string; email?: string }) => {
    loading.value = true;
    try {
      const response = await $fetch(`${apiUrl}/api/user/profile`, {
        method: 'PATCH',
        body: data,
        credentials: 'include',
      });

      if (response.user) {
        user.value = response.user;
      }

      return { success: true, user: response.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Update failed',
        errors: error.data?.errors,
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    loading.value = true;
    try {
      await $fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        body: { currentPassword, newPassword },
        credentials: 'include',
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || 'Password change failed',
        errors: error.data?.errors,
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => !!user.value);

  /**
   * Check if user is admin
   */
  const isAdmin = computed(() => user.value?.role === 'admin');

  return {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    changePassword,
    isAuthenticated,
    isAdmin,
  };
};
