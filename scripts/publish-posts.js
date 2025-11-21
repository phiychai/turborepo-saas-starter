#!/usr/bin/env node

/**
 * Script to publish all draft posts in Directus
 *
 * Usage:
 *   node scripts/publish-posts.js
 *
 * Environment variables:
 *   DIRECTUS_URL - Your Directus instance URL (default: http://localhost:8055)
 *   DIRECTUS_TOKEN - Your Directus admin token
 */

const axios = require('axios');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_TOKEN environment variable is required');
  process.exit(1);
}

/**
 * Get all draft posts
 */
async function getDraftPosts() {
  try {
    const response = await axios.get(`${DIRECTUS_URL}/items/posts`, {
      params: {
        filter: { status: { _eq: 'draft' } },
        fields: 'id,title,slug,status',
        limit: -1,
      },
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error fetching posts:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

/**
 * Update post status to published
 */
async function publishPost(postId) {
  try {
    const response = await axios.patch(
      `${DIRECTUS_URL}/items/posts/${postId}`,
      { status: 'published' },
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data || response.data;
  } catch (error) {
    console.error(`  ❌ Error publishing post ${postId}:`, error.message);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting post publishing process...\n');

  // Get all draft posts
  console.log('📋 Fetching draft posts...');
  const draftPosts = await getDraftPosts();

  if (draftPosts.length === 0) {
    console.log('✅ No draft posts found. All posts are already published!');
    return;
  }

  console.log(`📝 Found ${draftPosts.length} draft post(s) to publish\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < draftPosts.length; i++) {
    const post = draftPosts[i];
    console.log(`[${i + 1}/${draftPosts.length}] Publishing: ${post.title}`);

    const result = await publishPost(post.id);

    if (result) {
      console.log(`  ✅ Published: ${post.slug}`);
      successCount++;
    } else {
      console.log(`  ❌ Failed to publish`);
      failCount++;
    }

    // Small delay to avoid rate limiting
    if (i < draftPosts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully published: ${successCount} posts`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} posts`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run the script
main().catch(console.error);
