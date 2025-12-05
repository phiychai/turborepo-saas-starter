import { directusServer, readItems, withToken } from '~~/server/utils/directus-server';
import { resolveUsernameToDirectusUserId } from '~~/server/utils/resolve-username';

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username');
  const slug = getRouterParam(event, 'slug');

  if (!username || !slug) {
    throw createError({ statusCode: 400, message: 'Username and slug are required' });
  }

  // Handle live preview
  const query = getQuery(event);
  const { preview, token: rawToken } = query;
  const token = preview === 'true' && rawToken ? String(rawToken) : undefined;

  try {
    // Resolve username to Directus user ID
    const ownerId = await resolveUsernameToDirectusUserId(username);

    if (!ownerId) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    // Find user's default "articles" space
    const spaces = await directusServer.request(
      readItems('spaces', {
        filter: {
          owner: { _eq: ownerId },
          is_default: { _eq: true },
        },
        limit: 1,
        fields: ['id'],
      })
    );

    if (!spaces.length) {
      throw createError({ statusCode: 404, message: 'Default articles space not found' });
    }

    const articlesSpaceId = spaces[0].id;

    // Find post in the articles space
    const postQuery = {
      filter: {
        slug: { _eq: slug },
        space: { _eq: articlesSpaceId },
      },
      limit: 1,
      fields: [
        'id',
        'title',
        'content',
        'status',
        'published_at',
        'image',
        'description',
        'seo',
        {
          author: ['id', 'first_name', 'last_name', 'avatar'],
        },
        {
          space: ['id', 'slug', 'name'],
        },
        {
          categories: ['id', 'title', 'slug'],
        } as any,
      ],
    };

    const postsPromise = token
      ? directusServer.request(withToken(token, readItems('posts' as any, postQuery)))
      : directusServer.request(readItems('posts' as any, postQuery));

    // Related posts in the same space
    const relatedPostsQuery = {
      filter: {
        slug: { _neq: slug },
        space: { _eq: articlesSpaceId },
        status: { _eq: 'published' },
      },
      fields: ['id', 'title', 'image', 'slug'],
      limit: 2,
    };

    const relatedPostsPromise = token
      ? directusServer.request(withToken(token, readItems('posts' as any, relatedPostsQuery)))
      : directusServer.request(readItems('posts' as any, relatedPostsQuery));

    const [posts, relatedPosts] = await Promise.all([postsPromise, relatedPostsPromise]);

    if (!posts.length) {
      throw createError({ statusCode: 404, message: 'Article not found' });
    }

    return { post: posts[0], relatedPosts };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch article',
      data: error,
    });
  }
});
