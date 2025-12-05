#!/usr/bin/env node

/**
 * Script to clean up duplicate posts and ensure we have exactly 15 published posts
 *
 * Usage:
 *   node scripts/cleanup-duplicate-posts.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_TOKEN environment variable is required');
  process.exit(1);
}

// Load the expected posts from seed file
const postsFile = path.join(__dirname, 'seed-posts.json');
const expectedPosts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
const expectedSlugs = expectedPosts.map((p) => p.slug);

/**
 * Get all posts
 */
async function getAllPosts() {
  try {
    const response = await axios.get(`${DIRECTUS_URL}/items/posts`, {
      params: {
        fields: 'id,title,slug,status,date_created',
        limit: -1,
        sort: ['-date_created'],
      },
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error fetching posts:', error.message);
    return [];
  }
}

/**
 * Delete a post
 */
async function deletePost(postId) {
  try {
    await axios.delete(`${DIRECTUS_URL}/items/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
    });
    return true;
  } catch (error) {
    console.error(`  ❌ Error deleting post ${postId}:`, error.message);
    return false;
  }
}

/**
 * Update post to published
 */
async function publishPost(postId) {
  try {
    await axios.patch(
      `${DIRECTUS_URL}/items/posts/${postId}`,
      { status: 'published' },
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return true;
  } catch (error) {
    console.error(`  ❌ Error publishing post ${postId}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🧹 Starting cleanup process...\n');

  // Get all posts
  console.log('📋 Fetching all posts...');
  const allPosts = await getAllPosts();
  console.log(`Found ${allPosts.length} total posts\n`);

  // Group posts by slug
  const postsBySlug = {};
  allPosts.forEach((post) => {
    if (!postsBySlug[post.slug]) {
      postsBySlug[post.slug] = [];
    }
    postsBySlug[post.slug].push(post);
  });

  // Find duplicates
  const duplicates = [];
  const toKeep = [];
  const toDelete = [];

  Object.entries(postsBySlug).forEach(([slug, posts]) => {
    if (posts.length > 1) {
      // Sort by date_created (newest first) and keep the first one
      posts.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
      toKeep.push(posts[0]);
      toDelete.push(...posts.slice(1));
      duplicates.push({
        slug,
        count: posts.length,
        keeping: posts[0].id,
        deleting: posts.slice(1).map((p) => p.id),
      });
    } else {
      toKeep.push(posts[0]);
    }
  });

  console.log(`📊 Analysis:`);
  console.log(`  - Unique slugs: ${Object.keys(postsBySlug).length}`);
  console.log(`  - Duplicates found: ${duplicates.length}`);
  console.log(`  - Posts to delete: ${toDelete.length}`);
  console.log(`  - Posts to keep: ${toKeep.length}\n`);

  if (duplicates.length > 0) {
    console.log('🔍 Duplicate posts:');
    duplicates.forEach((dup) => {
      console.log(
        `  - ${dup.slug}: ${dup.count} copies (keeping newest, deleting ${dup.count - 1})`
      );
    });
    console.log('');
  }

  // Delete duplicates
  if (toDelete.length > 0) {
    console.log('🗑️  Deleting duplicate posts...');
    let deletedCount = 0;
    for (let i = 0; i < toDelete.length; i++) {
      const post = toDelete[i];
      console.log(`[${i + 1}/${toDelete.length}] Deleting: ${post.title} (${post.slug})`);
      if (await deletePost(post.id)) {
        deletedCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    console.log(`\n✅ Deleted ${deletedCount} duplicate posts\n`);
  }

  // Publish all remaining posts
  console.log('📢 Publishing all posts...');
  let publishedCount = 0;
  for (let i = 0; i < toKeep.length; i++) {
    const post = toKeep[i];
    if (post.status !== 'published') {
      console.log(`[${i + 1}/${toKeep.length}] Publishing: ${post.title}`);
      if (await publishPost(post.id)) {
        publishedCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  if (publishedCount > 0) {
    console.log(`\n✅ Published ${publishedCount} posts\n`);
  }

  // Final summary
  const finalPosts = await getAllPosts();
  const expectedPostsFound = finalPosts.filter((p) => expectedSlugs.includes(p.slug));
  const publishedPosts = finalPosts.filter((p) => p.status === 'published');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Final Status:`);
  console.log(`  - Total posts: ${finalPosts.length}`);
  console.log(`  - Published posts: ${publishedPosts.length}`);
  console.log(`  - Expected posts found: ${expectedPostsFound.length}/15`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run the script
main().catch(console.error);
