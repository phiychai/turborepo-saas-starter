import type { Schema } from '@turborepo-saas-starter/shared-types/schema';
import type { Post } from '@turborepo-saas-starter/shared-types/schema';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug is required' });
  }

  // Handle live preview
  const query = getQuery(event);
  const { preview, token: rawToken } = query;
  const token = preview === 'true' && rawToken ? String(rawToken) : null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postQuery: Record<string, any> = {
      filter: {
        slug: { _eq: slug },
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
        'categories',
        {
          author: ['id', 'first_name', 'last_name', 'avatar'],
        },
        {
          categories: ['id', 'title', 'slug'],
        },
      ],
    };

    const postsPromise = token
      ? directusServer.request(withToken(token, readItems('posts', postQuery)))
      : directusServer.request(readItems('posts', postQuery));

    // This is a really naive implementation of related posts. Just a basic check to ensure we don't return the same post. You might want to do something more sophisticated.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relatedPostsQuery: Record<string, any> = {
      filter: { slug: { _neq: slug } },
      fields: ['id', 'title', 'image', 'slug'],
      limit: 2,
    };

    const relatedPostsPromise = token
      ? directusServer.request(withToken(token, readItems('posts', relatedPostsQuery)))
      : directusServer.request(readItems('posts', relatedPostsQuery));

    const [posts, relatedPosts] = await Promise.all([postsPromise, relatedPostsPromise]);

    if (!posts.length) {
      throw createError({ statusCode: 404, message: `Post not found: ${slug}` });
    }

    return { post: posts[0], relatedPosts };
  } catch (error) {
    throw createError({ statusCode: 500, message: `Failed to fetch post: ${slug}`, data: error });
  }
});
