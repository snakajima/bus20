import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

// Production code keeps functions short (CLAUDE.md: under 20 lines, cognitive
// complexity at most 15). Tests may be longer because fixtures are inline.
const PRODUCTION_MAX_FUNCTION_LINES = 20;
const TEST_MAX_FUNCTION_LINES = 60;
const MAX_COMPLEXITY = 15;

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "bus20/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  eslintConfigPrettier,
  {
    files: ["packages/**/*.ts"],
    languageOptions: {
      globals: { ...globals.es2021, ...globals.node },
      parserOptions: {
        project: ["packages/*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        noWarnOnMultipleProjects: true,
      },
    },
    plugins: { prettier: prettierPlugin },
    settings: {
      "import/resolver": {
        typescript: { project: ["packages/*/tsconfig.json"] },
      },
    },
    rules: {
      "prettier/prettier": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-param-reassign": "error",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            { from: "package", package: "node:test", name: ["test", "describe", "it"] },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      complexity: ["error", { max: MAX_COMPLEXITY }],
      "sonarjs/cognitive-complexity": ["error", MAX_COMPLEXITY],
      "max-lines-per-function": [
        "error",
        { max: PRODUCTION_MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", { max: 3 }],
      "import/no-cycle": "error",
      "import/no-self-import": "error",
      "import/no-duplicates": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      // Package subpath exports resolve through package.json; the TypeScript
      // compiler already validates them.
      "import/no-unresolved": "off",
      "import/named": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/no-nested-conditional": "off",
    },
  },
  {
    // The program sandbox exists to execute generated code under node:vm with
    // frozen globals, CPU timeouts, and a separate process. Flagging every
    // runInContext call there reports the module's purpose, not a defect.
    files: ["packages/policy-runtime/src/sandbox.ts"],
    rules: {
      "sonarjs/code-eval": "off",
    },
  },
  {
    // The program sandbox exists to execute generated code under node:vm with
    // frozen globals, CPU timeouts, and a separate process. Flagging every
    // runInContext call there reports the module's purpose, not a defect.
    files: ["packages/policy-runtime/src/sandbox.ts"],
    rules: {
      "sonarjs/code-eval": "off",
    },
  },
  {
    files: ["packages/**/test/**/*.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: TEST_MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],
      "sonarjs/no-nested-functions": "off",
    },
  },
);
