import type { Schema } from '@turborepo-saas-starter/shared-types/schema';

type Category = Schema['categories'][number];

export default defineEventHandler(async (event) => {
  try {
    // Query categories collection directly
    const categories = await directusServer.request(
      readItems('categories', {
        fields: ['id', 'title', 'slug'],
        sort: ['title'],
        limit: -1,
      })
    );

    // Convert to expected format (ensure slug exists, generate from title if not)
    const formattedCategories = categories
      .map((cat: Category) => ({
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as { response?: { status?: number; url?: string } }).response : undefined;
    const is403 = errorMessage.includes('403') || errorResponse?.status === 403;

    console.error('Failed to fetch categories collection:', {
      message: errorMessage,
      status: errorResponse?.status,
      url: errorResponse?.url,
    });

    return { categories: [] };
  }
});
