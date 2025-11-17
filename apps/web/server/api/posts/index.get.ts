import { z } from 'zod';

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(12),
  page: z.coerce.number().min(1).default(1),
  category: z.string().optional(),
});

export default defineCachedEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.safeParse);

  if (!query.success) {
    throw createError({ statusCode: 400, message: 'Invalid query parameters' });
  }

  const { limit, page, category } = query.data;

  // Build filter - include category filter if provided
  const filter: any = { status: { _eq: 'published' } };

  if (category) {
    // Filter by category slug (categories field uses M2M relationship)
    filter.categories = {
      _some: {
        slug: { _eq: category },
      },
    };
  }

  try {
    // Try to fetch with categories first, fallback without if permissions issue
    let posts: any;
    try {
      posts = await directusServer.request(
        readItems('posts', {
          limit,
          page,
          sort: ['-published_at'],
          fields: [
            'id',
            'title',
            'description',
            'slug',
            'image',
            'categories',
            'published_at',
            {
              author: ['id', 'first_name', 'last_name', 'avatar'],
            },
            {
              categories: ['id', 'title', 'slug'] as any,
            } as any,
          ],
          filter,
        })
      );
    } catch (error: any) {
      // If categories field causes permission error, fetch without it
      if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
        console.warn('Categories field requires permissions, fetching posts without categories');
        posts = await directusServer.request(
          readItems('posts', {
            limit,
            page,
            sort: ['-published_at'],
            fields: [
              'id',
              'title',
              'description',
              'slug',
              'image',
              'published_at',
              {
                author: ['id', 'first_name', 'last_name', 'avatar'],
              },
            ],
            filter: { status: { _eq: 'published' } }, // Remove category filter if no categories
          })
        );
      } else {
        throw error;
      }
    }

    const countPromise = directusServer.request(
      readItems('posts', {
        aggregate: { count: '*' },
        filter: { status: { _eq: 'published' } }, // Use basic filter for count
      })
    );

    const countResult = await countPromise;
    const count =
      Array.isArray(countResult) && countResult[0] && 'count' in countResult[0]
        ? Number(countResult[0].count)
        : 0;

    return {
      posts,
      count,
    };
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    console.error('Error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      filter,
      category,
    });
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch paginated posts',
      data: {
        error: error?.message || String(error),
        details: error?.response?.data || error?.response,
      },
    });
  }
});
