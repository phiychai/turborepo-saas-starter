import type { DashboardUser } from '~/types';

/**
 * Get all customers (users) from backend
 * Proxies to backend API and maps Better Auth user data to DashboardUser format
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiUrl || 'http://localhost:3333';

  try {
    // Forward headers (including auth cookies)
    const headers: Record<string, string> = {};
    const incomingHeaders = getHeaders(event);

    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    }

    // Fetch users from backend
    const response = await fetch(`${backendUrl}/api/user/users`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Not authenticated',
        });
      }
      if (response.status === 403) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. Admin access required.',
        });
      }
      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to fetch users',
      });
    }

    const data = await response.json();
    const users = data.users || [];

    // Map Better Auth user data to DashboardUser format expected by the table
    const customers: DashboardUser[] = users.map((user: any) => {
      // Generate display name from firstName/lastName or name or email
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.name || user.email?.split('@')[0] || 'User';

      // Map emailVerified status to subscription status
      // You can customize this logic based on your business needs
      const status: DashboardUser['status'] = user.emailVerified ? 'subscribed' : 'unsubscribed';

      // Generate avatar URL (use image if available, otherwise generate from email)
      const avatarSrc = user.image || `https://i.pravatar.cc/128?u=${user.id}`;

      // Location could come from user profile or be set based on other data
      // For now, using a placeholder - you can add location field to Better Auth user table
      const location = 'Not set'; // TODO: Add location field to user table or fetch from another source

      // Better Auth uses string IDs, but DashboardUser expects number
      // Convert string ID to a numeric hash for table compatibility
      // In production, you might want to change DashboardUser.id to string
      const numericId =
        typeof user.id === 'string'
          ? parseInt(user.id.slice(0, 8), 16) || Date.now() % 1000000
          : user.id;

      return {
        id: numericId,
        name: displayName,
        email: user.email,
        avatar: {
          src: avatarSrc,
        },
        status,
        location,
      } as DashboardUser;
    });

    return customers;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch customers',
      data: error.message,
    });
  }
});
