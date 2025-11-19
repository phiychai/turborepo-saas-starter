import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    globals: true,
    // Exclude .data directory from test discovery (contains Nuxt Content test files)
    exclude: ['**/node_modules/**', '**/.data/**', '**/dist/**', '**/.nuxt/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.nuxt/', 'dist/', '.data/', '*.config.*'],
    },
  },
});
