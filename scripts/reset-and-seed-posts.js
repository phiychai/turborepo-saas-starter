#!/usr/bin/env node

/**
 * Script to delete all existing posts and create fresh ones
 * This ensures we have exactly 15 published posts with no duplicates
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FOLDER_ID = process.env.DIRECTUS_FOLDER_ID || 'ece7bab9-5433-4a63-b9f7-bde8b517d6d9';
const AUTHOR_ID = process.env.DIRECTUS_AUTHOR_ID || 'd56956bf-6ed0-465e-bb4a-ec9bde65c5f0';

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_TOKEN environment variable is required');
  process.exit(1);
}

// Load posts from JSON file
const postsFile = path.join(__dirname, 'seed-posts.json');
const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));

/**
 * Delete all posts
 */
async function deleteAllPosts() {
  try {
    // Get all post IDs
    const response = await axios.get(`${DIRECTUS_URL}/items/posts`, {
      params: {
        fields: 'id',
        limit: -1,
      },
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
    });

    const postIds = (response.data.data || []).map((p) => p.id);

    if (postIds.length === 0) {
      console.log('No posts to delete\n');
      return;
    }

    console.log(`🗑️  Deleting ${postIds.length} existing posts...`);

    // Delete in batches
    for (let i = 0; i < postIds.length; i++) {
      try {
        await axios.delete(`${DIRECTUS_URL}/items/posts/${postIds[i]}`, {
          headers: {
            Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          },
        });
        if ((i + 1) % 5 === 0) {
          console.log(`  Deleted ${i + 1}/${postIds.length}...`);
        }
      } catch (error) {
        // Continue even if some fail
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Deleted ${postIds.length} posts\n`);
  } catch (error) {
    console.error('Error deleting posts:', error.message);
  }
}

/**
 * Download image from URL
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? require('https') : require('http');

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Upload image to Directus
 */
async function uploadImage(imageUrl, title) {
  try {
    const imageBuffer = await downloadImage(imageUrl);
    const FormData = require('form-data');
    const form = new FormData();

    const filename = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.jpg`;
    form.append('file', imageBuffer, {
      filename,
      contentType: 'image/jpeg',
    });
    form.append('folder', FOLDER_ID);
    form.append('title', title);

    const uploadResponse = await axios.post(`${DIRECTUS_URL}/files`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return uploadResponse.data.data.id;
  } catch (error) {
    console.error(`  ❌ Error uploading image: ${error.message}`);
    return null;
  }
}

/**
 * Create post in Directus
 */
async function createPost(postData, imageId) {
  try {
    const postPayload = {
      title: postData.title,
      slug: postData.slug,
      description: postData.description,
      content: postData.content,
      status: 'draft', // Must create as draft first
      published_at: postData.published_at,
      sort: postData.sort,
      author: AUTHOR_ID,
    };

    if (imageId) {
      postPayload.image = imageId;
    }

    // Include SEO field
    if (postData.seo) {
      postPayload.seo = postData.seo;
    }

    console.log(`  📤 Creating post: ${postPayload.slug}`);
    const response = await axios.post(`${DIRECTUS_URL}/items/posts`, postPayload, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`  📥 Response status: ${response.status}`);

    // Wait a bit for the post to be saved
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify it was created - try multiple times
    let post = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const verifyResponse = await axios.get(`${DIRECTUS_URL}/items/posts`, {
          params: {
            filter: { slug: { _eq: postPayload.slug } },
            limit: 1,
            fields: 'id,title,slug,status',
          },
          headers: {
            Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          },
        });

        if (verifyResponse.data.data && verifyResponse.data.data.length > 0) {
          post = verifyResponse.data.data[0];
          break;
        }
      } catch (e) {
        // Continue to next attempt
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (post) {
      console.log(`  ✅ Post found: ${post.id}`);
      // If it was created as draft, publish it
      if (post.status !== 'published') {
        console.log(`  📢 Publishing post...`);
        await axios.patch(
          `${DIRECTUS_URL}/items/posts/${post.id}`,
          { status: 'published' },
          {
            headers: {
              Authorization: `Bearer ${DIRECTUS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );
        post.status = 'published';
      }
      return post;
    }

    console.log(`  ⚠️  Post not found after creation (status was ${response.status})`);
    return null;
  } catch (error) {
    console.error(`  ❌ Error creating post: ${error.message}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error(`  No response received`);
    } else {
      console.error(`  Error:`, error);
    }
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Starting reset and seed process...\n');

  // Step 1: Delete all existing posts
  await deleteAllPosts();

  // Step 2: Create new posts
  console.log(`📝 Creating ${posts.length} new posts...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] Processing: ${post.title}`);

    try {
      // Upload image
      let imageId = null;
      if (post.image_url) {
        imageId = await uploadImage(post.image_url, post.title);
        if (imageId) {
          console.log(`  ✅ Image uploaded`);
        }
      }

      // Create post
      const createdPost = await createPost(post, imageId);

      if (createdPost) {
        console.log(`  ✅ Post created and published: ${createdPost.slug}`);
        successCount++;
      } else {
        console.log(`  ❌ Failed to create post (check error above)`);
        failCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      failCount++;
    }

    // Delay between posts
    if (i < posts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    console.log('');
  }

  // Final verification
  const finalCheck = await axios.get(`${DIRECTUS_URL}/items/posts`, {
    params: {
      fields: 'id,title,slug,status',
      limit: -1,
    },
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
  });

  const allPosts = finalCheck.data.data || [];
  const publishedPosts = allPosts.filter((p) => p.status === 'published');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully created: ${successCount} posts`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} posts`);
  }
  console.log(`📊 Final count: ${allPosts.length} total posts, ${publishedPosts.length} published`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run the script
main().catch(console.error);
