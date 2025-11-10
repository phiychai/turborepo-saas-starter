export default defineEventHandler(async (event) => {
  try {
    // Query categories collection directly
    const categories = await directusServer.request(
      readItems('categories' as any, {
        fields: ['id', 'title', 'slug'],
        sort: ['title'],
        limit: -1,
      })
    );

    // Convert to expected format (ensure slug exists, generate from title if not)
    const formattedCategories = categories
      .map((cat: any) => ({
        id: String(cat.id),
        name: String(cat.title || ''),
        slug: cat.slug
          ? String(cat.slug)
          : String(cat.title || '')
              .toLowerCase()
              .replace(/\s+/g, '-'),
      }))
      .filter((cat) => cat.name) // Only include categories with names
      .sort((a, b) => a.name.localeCompare(b.name));

    return { categories: formattedCategories };
  } catch (error: any) {
    const is403 = error?.message?.includes('403') || error?.response?.status === 403;

    console.error('Failed to fetch categories collection:', {
      message: error?.message,
      status: error?.response?.status,
      url: error?.response?.url,
    });

    return { categories: [] };
  }
});
