import tseslint from 'typescript-eslint';
import baseConfig from './base.js';

/**
 * Node.js/Backend ESLint configuration
 * Extends TypeScript config with Node.js-specific settings
 */
export default tseslint.config(...baseConfig, ...tseslint.configs.recommended, {
  files: ['**/*.ts', '**/*.js', '**/*.mts', '**/*.cts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    globals: {
      // Node.js globals
      process: 'readonly',
      __dirname: 'readonly',
      __filename: 'readonly',
      Buffer: 'readonly',
      console: 'readonly',
      module: 'readonly',
      require: 'readonly',
      exports: 'readonly',
      global: 'readonly',
      setImmediate: 'readonly',
      clearImmediate: 'readonly',
    },
  },
  rules: {
    // Node.js-specific rules
    'no-console': 'off', // Console is fine in Node.js
    'no-process-exit': 'error',
    'no-path-concat': 'error',

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],
    '@typescript-eslint/consistent-type-exports': [
      'error',
      {
        fixMixedExportsWithInlineTypeSpecifier: true,
      },
    ],
    '@typescript-eslint/no-import-type-side-effects': 'error',

    // Disable base rules that are covered by TypeScript equivalents
    'no-unused-vars': 'off',
  },
});
