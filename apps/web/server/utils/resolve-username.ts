import { directusServer, readItems, createItem, withToken } from './directus-server';

/**
 * Resolve username to Directus user ID
 *
 * Flow:
 * 1. Query AdonisJS backend public API to get user by username
 * 2. Use email from AdonisJS user to find corresponding Directus user
 * 3. If not found, attempt to create Directus user (if server token available)
 * 4. Return Directus user ID
 */
export async function resolveUsernameToDirectusUserId(username: string): Promise<string | null> {
  try {
    const {
      public: { apiUrl },
      directusServerToken,
    } = useRuntimeConfig();

    // Step 1: Get user from AdonisJS by username
    const adonisUser = await $fetch<{
      id: number;
      username: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      betterAuthUserId: string | null;
    }>(`${apiUrl}/api/public/users/${username}`).catch(() => null);

    if (!adonisUser || !adonisUser.email) {
      return null;
    }

    // Step 2: Find Directus user by email (most reliable matching field)
    const directusUsers = await directusServer.request(
      readItems('directus_users', {
        filter: {
          email: { _eq: adonisUser.email },
        },
        limit: 1,
        fields: ['id'],
      })
    );

    if (directusUsers.length > 0) {
      return directusUsers[0].id;
    }

    // Step 3: If not found and we have server token, create Directus user
    if (directusServerToken) {
      try {
        const newDirectusUser = await directusServer.request(
          withToken(
            directusServerToken as string,
            createItem('directus_users', {
              email: adonisUser.email,
              first_name: adonisUser.firstName || null,
              last_name: adonisUser.lastName || null,
              status: 'active',
              // Note: Directus users created this way won't have passwords
              // They can only be used for content management, not authentication
            } as never)
          )
        );

        console.warn(`Created Directus user for ${adonisUser.email} (${newDirectusUser.id})`);
        return newDirectusUser.id;
      } catch (createError: unknown) {
        const errorMessage =
          createError instanceof Error ? createError.message : String(createError);
        console.error(`Failed to create Directus user for ${adonisUser.email}:`, errorMessage);
        // Continue to return null - user exists in AdonisJS but not in Directus
      }
    }

    // If not found and couldn't create, user doesn't exist in Directus
    console.warn(
      `Directus user not found for email: ${adonisUser.email}. ` +
        `User exists in AdonisJS but not in Directus. ` +
        `Consider syncing users or ensure DIRECTUS_SERVER_TOKEN is set to auto-create users.`
    );
    return null;
  } catch (error) {
    console.error('Error resolving username:', error);
    return null;
  }
}
