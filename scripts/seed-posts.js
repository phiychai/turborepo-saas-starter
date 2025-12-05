#!/usr/bin/env node

/**
 * Script to seed Directus with blog posts and images
 *
 * Usage:
 *   node scripts/seed-posts.js
 *
 * Environment variables:
 *   DIRECTUS_URL - Your Directus instance URL (default: http://localhost:8055)
 *   DIRECTUS_TOKEN - Your Directus admin token
 *   DIRECTUS_FOLDER_ID - Folder ID for images (default: ece7bab9-5433-4a63-b9f7-bde8b517d6d9)
 *   DIRECTUS_AUTHOR_ID - Author user ID (default: d56956bf-6ed0-465e-bb4a-ec9bde65c5f0)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FOLDER_ID = process.env.DIRECTUS_FOLDER_ID || 'ece7bab9-5433-4a63-b9f7-bde8b517d6d9';
const AUTHOR_ID = process.env.DIRECTUS_AUTHOR_ID || 'd56956bf-6ed0-465e-bb4a-ec9bde65c5f0';

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_TOKEN environment variable is required');
  console.error('   Set it with: export DIRECTUS_TOKEN=your-token-here');
  process.exit(1);
}

// Load posts from JSON file
const postsFile = path.join(__dirname, 'seed-posts.json');
const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));

/**
 * Download image from URL
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
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
    console.log(`  📥 Downloading image for: ${title}`);
    const imageBuffer = await downloadImage(imageUrl);

    // Create form data
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

    // Upload to Directus
    const axios = require('axios');
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
    if (error.response) {
      console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
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
      status: postData.status,
      published_at: postData.published_at,
      sort: postData.sort,
      author: AUTHOR_ID,
      seo: postData.seo,
    };

    if (imageId) {
      postPayload.image = imageId;
    }

    const axios = require('axios');
    const response = await axios.post(`${DIRECTUS_URL}/items/posts`, postPayload, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    // Directus returns 204 (No Content) for successful creates, or 200 with data
    // For 204, we need to fetch the created item to get its ID
    if (response.status === 204 || (response.data && !response.data.data && !response.data.id)) {
      // Post was created, wait a moment then fetch it
      await new Promise((resolve) => setTimeout(resolve, 500));

      const fetchResponse = await axios.get(`${DIRECTUS_URL}/items/posts`, {
        params: {
          filter: { slug: { _eq: postPayload.slug } },
          limit: 1,
          fields: 'id,title,slug,status',
        },
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
      });

      if (fetchResponse.data.data && fetchResponse.data.data.length > 0) {
        const createdPost = fetchResponse.data.data[0];
        // Immediately publish it
        if (createdPost.status !== 'published') {
          await axios.patch(
            `${DIRECTUS_URL}/items/posts/${createdPost.id}`,
            { status: 'published' },
            {
              headers: {
                Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );
        }
        return createdPost;
      }
      // If we can't fetch it, return a success indicator anyway
      return { id: 'created', slug: postPayload.slug, title: postPayload.title };
    }

    // Directus returns data in response.data.data or just response.data
    const result = response.data.data || response.data;

    // If we got the post back, publish it immediately
    if (result && result.id && result.status !== 'published') {
      await axios.patch(
        `${DIRECTUS_URL}/items/posts/${result.id}`,
        { status: 'published' },
        {
          headers: {
            Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      result.status = 'published';
    }

    return result;
  } catch (error) {
    console.log(`  ❌ Error creating post: ${error.message}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log(`  No response received. Request:`, error.request);
    } else {
      console.log(`  Full error:`, error);
    }
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting post seeding process...\n');
  console.log(`📝 Processing ${posts.length} posts...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] Processing: ${post.title}`);

    try {
      // Upload image if URL is provided
      let imageId = null;
      if (post.image_url) {
        imageId = await uploadImage(post.image_url, post.title);
        if (!imageId) {
          console.log(`  ⚠️  Warning: Image upload failed, continuing without image`);
        } else {
          console.log(`  ✅ Image uploaded: ${imageId}`);
        }
      }

      // Create post
      const createdPost = await createPost(post, imageId);

      if (createdPost) {
        console.log(`  ✅ Post created: ${createdPost.id}`);
        successCount++;
      } else {
        console.log(`  ❌ Failed to create post (check error above)`);
        failCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      failCount++;
    }

    // Small delay to avoid rate limiting
    if (i < posts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully created: ${successCount} posts`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} posts`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run the script
main().catch(console.error);
