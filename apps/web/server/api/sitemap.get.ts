/**
 * Sitemap source for dynamic pages and posts from Directus
 * Used by @nuxtjs/seo sitemap module
 */
import { directusServer, readItems } from '../utils/directus-server';
import type { Page, Post, Space } from '@turborepo-saas-starter/shared-types/schema';

export default defineEventHandler(async () => {
  try {
    const pagesPromise = directusServer.request(
      readItems('pages', {
        fields: ['permalink', 'date_updated'],
      })
    );

    // Get posts with space and author info
    const postsPromise = directusServer.request(
      readItems('posts', {
        filter: { status: { _eq: 'published' } },
        fields: [
          'slug',
          'date_updated',
          {
            author: ['id', 'email'],
          },
          {
            space: ['id', 'slug', 'owner', 'is_default'],
          },
        ],
      })
    );

    const [pages, posts] = await Promise.all([pagesPromise, postsPromise]);

    const pageUrls = (pages as Page[]).map((page: Page) => ({
      loc: page.permalink,
      lastmod: page.date_updated,
    }));

    // Legacy blog URLs (for backward compatibility)
    const legacyPostUrls = (posts as Post[])
      .filter((post: Post) => !post.space) // Posts without spaces
      .map((post: Post) => ({
        loc: `/blog/${post.slug}`,
        lastmod: post.date_updated,
      }));

    // New space-based URLs
    // TODO: Resolve username from author/owner - for now using email prefix as placeholder
    const spacePostUrls: Array<{ loc: string; lastmod: string | null }> = [];

    for (const post of posts as Post[]) {
      if (!post.space || !post.author) continue;

      const space = typeof post.space === 'string' ? null : (post.space as Space);
      const author = typeof post.author === 'string' ? null : post.author;

      if (!space || !author) continue;

      // TODO: Get username from author - for now using email prefix
      // This needs proper username resolution implementation
      const authorEmail = typeof author === 'object' && 'email' in author ? author.email : null;
      const username = (authorEmail as string)?.split('@')[0] || 'user';

      if (space.is_default) {
        // General article: /@username/article/slug
        spacePostUrls.push({
          loc: `/@${username}/article/${post.slug}`,
          lastmod: post.date_updated || null,
        });
      } else {
        // Space post: /@username/space-slug/slug
        spacePostUrls.push({
          loc: `/@${username}/${space.slug}/${post.slug}`,
          lastmod: post.date_updated || null,
        });
      }
    }

    // Profile URLs (generated from posts to avoid duplicate spaces query)
    const profileUrls: Array<{ loc: string; lastmod: string | null }> = [];
    const processedUsernames = new Set<string>();

    for (const post of posts as Post[]) {
      if (!post.author) continue;

      const author = typeof post.author === 'string' ? null : post.author;
      if (!author) continue;

      // TODO: Get username from author - for now using email prefix
      const authorEmail = typeof author === 'object' && 'email' in author ? author.email : null;
      const username = (authorEmail as string)?.split('@')[0] || 'user';

      // Add profile URL once per user
      if (!processedUsernames.has(username)) {
        profileUrls.push({
          loc: `/@${username}`,
          lastmod: null, // Profile pages don't have a specific lastmod
        });
        processedUsernames.add(username);
      }
    }

    return [...pageUrls, ...legacyPostUrls, ...spacePostUrls, ...profileUrls];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
});
