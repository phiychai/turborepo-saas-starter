import { directusServer, readItems } from '~~/server/utils/directus-server';
import { resolveUsernameToDirectusUserId } from '~~/server/utils/resolve-username';

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username');

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' });
  }

  try {
    const {
      public: { apiUrl },
    } = useRuntimeConfig();

    // Step 1: Get user info from AdonisJS
    let adonisUser: {
      id: number;
      username: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      bio: string | null;
      betterAuthUserId: string | null;
    } | null = null;

    try {
      adonisUser = await $fetch<typeof adonisUser>(`${apiUrl}/api/public/users/${username}`);
    } catch (error: any) {
      console.error(`Error fetching user from AdonisJS for username "${username}":`, error);
      if (error.statusCode === 404 || error.status === 404) {
        throw createError({ statusCode: 404, message: `User "${username}" not found` });
      }
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch user information',
        data: error,
      });
    }

    if (!adonisUser) {
      throw createError({ statusCode: 404, message: `User "${username}" not found` });
    }

    // Step 2: Resolve to Directus user ID
    const directusUserId = await resolveUsernameToDirectusUserId(username);

    if (!directusUserId) {
      console.warn(
        `User "${username}" found in AdonisJS but not in Directus. Email: ${adonisUser.email}`
      );
      // Return profile with empty spaces/posts if user exists in AdonisJS but not in Directus
      return {
        user: {
          id: adonisUser.id,
          username: adonisUser.username,
          firstName: adonisUser.firstName,
          lastName: adonisUser.lastName,
          fullName:
            adonisUser.firstName && adonisUser.lastName
              ? `${adonisUser.firstName} ${adonisUser.lastName}`
              : adonisUser.firstName || adonisUser.lastName || adonisUser.username || 'User',
          avatarUrl: adonisUser.avatarUrl,
          bio: adonisUser.bio,
          email: adonisUser.email,
        },
        spaces: [],
        recentPosts: [],
      };
    }

    // Step 3: Get user's spaces
    const spaces = await directusServer.request(
      readItems('spaces', {
        filter: {
          owner: { _eq: directusUserId },
        },
        fields: ['id', 'slug', 'name', 'description', 'is_default'],
        sort: ['is_default', 'name'],
      })
    );

    // Step 4: Get recent posts across all spaces (limit to 10 most recent)
    const recentPosts = await directusServer.request(
      readItems('posts', {
        filter: {
          author: { _eq: directusUserId },
          status: { _eq: 'published' },
        },
        fields: [
          'id',
          'title',
          'description',
          'slug',
          'image',
          'published_at',
          {
            space: ['id', 'slug', 'name', 'is_default'],
          },
        ],
        sort: ['-published_at'],
        limit: 10,
      })
    );

    return {
      user: {
        id: adonisUser.id,
        username: adonisUser.username,
        firstName: adonisUser.firstName,
        lastName: adonisUser.lastName,
        fullName:
          adonisUser.firstName && adonisUser.lastName
            ? `${adonisUser.firstName} ${adonisUser.lastName}`
            : adonisUser.firstName || adonisUser.lastName || adonisUser.username || 'User',
        avatarUrl: adonisUser.avatarUrl,
        bio: adonisUser.bio,
        email: adonisUser.email, // Include for display name fallback
      },
      spaces,
      recentPosts,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user profile',
      data: error,
    });
  }
});
