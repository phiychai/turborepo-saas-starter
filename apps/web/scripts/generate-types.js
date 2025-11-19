import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { generateDirectusTypes } from 'directus-sdk-typegen';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../'); // Go up two levels to project root
const webAppRoot = resolve(__dirname, '../'); // apps/web directory

// Load .env from apps/web directory
dotenv.config({ path: join(webAppRoot, '.env') });

async function generateTypes() {
  const directusUrl = process.env.DIRECTUS_URL;
  const directusToken = process.env.DIRECTUS_SERVER_TOKEN;

  if (!directusUrl || !directusToken) {
    console.error('Error: DIRECTUS_URL or DIRECTUS_SERVER_TOKEN is missing in the .env file.');
    console.error('Looking for .env at:', join(webAppRoot, '.env'));
    process.exit(1);
  }

  try {
    const outputPath = join(projectRoot, '../packages', 'shared-types', 'src', 'schema.ts');

    // Log the path to help debug in case of errors
    console.log('Attempting to write to:', outputPath);

    await generateDirectusTypes({
      outputPath,
      directusUrl,
      directusToken,
    });
    console.log('Types successfully generated!');
  } catch (error) {
    console.error('Failed to generate types:', error);
    console.error('Current directory:', __dirname);
    console.error('Project root:', projectRoot);
    process.exit(1);
  }
}

generateTypes();
