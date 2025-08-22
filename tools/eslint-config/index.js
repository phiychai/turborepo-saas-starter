const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  js.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
      import: importPlugin,
    },
    rules: {
      // Stylistic rules
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],

      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
    },
  },
];