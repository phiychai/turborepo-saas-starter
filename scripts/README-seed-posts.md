# Seed Posts Script

This script uploads 15 blog posts with images to your Directus instance.

## Prerequisites

1. **Node.js dependencies**: Install required packages
   ```bash
   cd /path/to/turborepo-saas-starter
   pnpm add -D axios form-data
   ```

2. **Directus Admin Token**: You need an admin token from Directus
   - Go to your Directus admin panel
   - Navigate to Settings → Access Tokens
   - Create a new token with Admin role
   - Copy the token

## Usage

### Option 1: Using Environment Variables

```bash
export DIRECTUS_URL="http://localhost:8055"
export DIRECTUS_TOKEN="your-admin-token-here"
node scripts/seed-posts.js
```

### Option 2: Using Command Line Arguments

You can also modify the script to accept command line arguments, or set them inline:

```bash
DIRECTUS_URL="http://localhost:8055" DIRECTUS_TOKEN="your-token" node scripts/seed-posts.js
```

## Configuration

The script uses these environment variables (with defaults):

- `DIRECTUS_URL` - Your Directus instance URL (default: `http://localhost:8055`)
- `DIRECTUS_TOKEN` - **Required** - Your Directus admin token
- `DIRECTUS_FOLDER_ID` - Folder ID for images (default: `ece7bab9-5433-4a63-b9f7-bde8b517d6d9`)
- `DIRECTUS_AUTHOR_ID` - Author user ID (default: `d56956bf-6ed0-465e-bb4a-ec9bde65c5f0`)

## What It Does

1. Reads 15 blog posts from `seed-posts.json`
2. Downloads images from Unsplash URLs
3. Uploads images to Directus
4. Creates posts with the uploaded images
5. Sets SEO metadata for each post

## Posts Included

1. The Future of Web Development: AI-Powered Coding Assistants
2. Building Scalable Microservices: Best Practices and Patterns
3. The Art of Code Review: Building Better Software Together
4. TypeScript vs JavaScript: When to Use Each
5. Design Systems: Creating Consistency at Scale
6. Performance Optimization: Making Your Web Apps Lightning Fast
7. The Power of Serverless: Building Scalable Applications
8. Accessibility First: Building Inclusive Web Experiences
9. GraphQL vs REST: Choosing the Right API Architecture
10. Modern CSS: Flexbox, Grid, and Beyond
11. Testing Strategies: Unit, Integration, and E2E
12. DevOps Essentials: CI/CD Pipelines and Automation
13. React Hooks: Mastering Modern React Development
14. Database Design: From Concept to Implementation
15. Security Best Practices for Web Applications

## Troubleshooting

### Error: DIRECTUS_TOKEN environment variable is required
- Make sure you've set the `DIRECTUS_TOKEN` environment variable
- Get your token from Directus admin panel → Settings → Access Tokens

### Error: Failed to download image
- Check your internet connection
- Unsplash URLs should be accessible
- The script will continue without images if download fails

### Error: Failed to create post
- Verify your Directus URL is correct
- Check that your token has admin permissions
- Ensure the posts collection exists in Directus
- Check Directus logs for more details

## Notes

- Images are downloaded from Unsplash (free, no API key required)
- Each post includes full content, SEO metadata, and publication dates
- The script includes a 1-second delay between posts to avoid rate limiting
- If image upload fails, the post will still be created without an image

