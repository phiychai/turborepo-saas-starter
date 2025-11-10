export default defineEventHandler(async (event) => {
  try {
    // Fetch all categories
    const categories = await directusServer.request(
      readItems('categories', {
        fields: ['id', 'name', 'slug'],
        sort: ['sort', 'name'],
        limit: -1,
      })
    );

    return { categories };
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to fetch categories', data: error });
  }
});

