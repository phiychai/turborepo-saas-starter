import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// @ts-expect-error - ESLint config doesn't provide types
import nodeConfig from "@turborepo-saas-starter/eslint-config/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...nodeConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Backend-specific overrides
    rules: {
      // Allow console in backend
      "no-console": "off",
    },
  },
  {
    ignores: ["build/**", "tmp/**", "node_modules/**", "ace.js", "**/*.generated.*", "**/*.cjs"],
  },
];
