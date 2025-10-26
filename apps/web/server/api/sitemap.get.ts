/**
 * Sitemap source for dynamic pages and posts from Directus
 * Used by @nuxtjs/seo sitemap module
 */
export default defineEventHandler(async () => {
  try {
    const pagesPromise = directusServer.request(
      readItems('pages', {
        fields: ['permalink', 'date_updated'],
      })
    );

    const postsPromise = directusServer.request(
      readItems('posts', {
        filter: { status: { _eq: 'published' } },
        fields: ['slug', 'date_updated'],
      })
    );

    const [pages, posts] = await Promise.all([pagesPromise, postsPromise]);

    const pageUrls = pages.map((page) => ({
      loc: page.permalink,
      lastmod: page.date_updated,
    }));

    const postUrls = posts.map((post) => ({
      loc: `/blog/${post.slug}`,
      lastmod: post.date_updated,
    }));

    return [...pageUrls, ...postUrls];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
});
