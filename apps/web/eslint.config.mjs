import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import vueConfig from '@turborepo-saas-starter/eslint-config/vue';
import withNuxt from './.nuxt/eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Filter out import plugin from vueConfig since Nuxt provides its own
const vueConfigWithoutImport = vueConfig.map((config) => {
  if (config.plugins?.import) {
    const plugins = { ...config.plugins };
    delete plugins.import;
    return {
      ...config,
      plugins,
      rules: Object.fromEntries(
        Object.entries(config.rules || {}).filter(([key]) => !key.startsWith('import/'))
      ),
    };
  }
  return config;
});

export default withNuxt(
  ...vueConfigWithoutImport,
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
      'content.config.ts',
      'vitest.config.ts',
      'tests/**',
    ],
  }
);
