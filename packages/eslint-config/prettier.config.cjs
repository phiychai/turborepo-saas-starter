/**
 * Shared Prettier configuration
 * This config is used across all projects in the monorepo
 */
module.exports = {
  // Print width - try to break lines at 100 characters
  printWidth: 100,

  // Use 2 spaces for indentation
  tabWidth: 2,

  // Use spaces instead of tabs
  useTabs: false,

  // Add semicolons at the end of statements
  semi: true,

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Only add quotes around object properties when necessary
  quoteProps: 'as-needed',

  // Use single quotes in JSX
  jsxSingleQuote: false,

  // Add trailing commas in multi-line comma-separated syntactic structures
  trailingComma: 'es5',

  // Print spaces between brackets in object literals
  bracketSpacing: true,

  // Put the > of a multi-line HTML element at the end of the last line
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter
  arrowParens: 'always',

  // Format only the content of the file that's been changed
  rangeStart: 0,
  rangeEnd: Infinity,

  // Wrap prose if it exceeds the print width
  proseWrap: 'preserve',

  // Respect HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Ensure consistent line endings (LF)
  endOfLine: 'lf',

  // Control whether Prettier formats quoted code embedded in the file
  embeddedLanguageFormatting: 'auto',

  // Enforce single attribute per line in HTML/Vue/JSX
  singleAttributePerLine: false,

  // Vue-specific settings
  vueIndentScriptAndStyle: false,

  // Plugin-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
  ],
};

