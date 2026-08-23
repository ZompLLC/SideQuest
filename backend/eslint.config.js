// @ts-check
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "eslint.config.js"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": ["error"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      // Required for Express's `declare global { namespace Express { ... } }`
      // request-augmentation pattern -- there's no ES-module equivalent.
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    },
  },
  {
    files: ["**/tests/**"],
    rules: {
      // Combined unit/integration test files need jest.resetModules() +
      // require() to re-import mocked vs. real modules per describe block --
      // a static import is bound once at file-parse time and can't do that.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
