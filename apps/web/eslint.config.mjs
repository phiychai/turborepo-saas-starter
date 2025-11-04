import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import vueConfig from '@turborepo-saas-starter/eslint-config/vue';
import withNuxt from './.nuxt/eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default withNuxt(
  ...vueConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      'build/**',
      '.nuxt/**',
      '.output/**',
      'node_modules/**',
      '**/*.generated.*',
      '**/*.cjs',
    ],
  }
);
