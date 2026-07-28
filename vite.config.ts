import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    useTabs: false,
    tabWidth: 2,
    printWidth: 100,
    singleQuote: false,
    jsxSingleQuote: false,
    quoteProps: "as-needed",
    trailingComma: "es5",
    semi: true,
    jsdoc: true,
    arrowParens: "always",
    bracketSameLine: false,
    bracketSpacing: true,
    ignorePatterns: [
      "**/.agents/**",
      "**/dist/**",
      "**/dev-dist/**",
      "**/routeTree.gen.ts",
      "**/test-results/**",
      "**/migrations/**",
      "tests/**",
    ],
    sortTailwindcss: {
      stylesheet: "packages/_ui/src/styles/globals.css",
      functions: ["clsx", "cva", "cn"],
    },
    experimentalSortImports: {
      newlinesBetween: true,
      internalPattern: ["@/", "~/", "#/", "@modular-vsa/"],
      groups: [
        ["builtin", "external"],
        "internal",
        "style",
        ["parent", "sibling", "index"],
        "unknown",
      ],
    },
  },
  lint: {
    plugins: [
      "eslint",
      "typescript",
      "unicorn",
      "oxc",
      "react",
      "react-perf",
      "promise",
      "import",
      "jsx-a11y",
      "node",
    ],
    env: {
      builtin: true,
      browser: true,
    },
    categories: {
      correctness: "error",
    },
    ignorePatterns: [
      "**/.agents/**",
      "**/dist/**",
      "**/dev-dist/**",
      "**/routeTree.gen.ts",
      "**/test-results/**",
      "**/migrations/**",
      "tests/**",
    ],
    rules: {
      "typescript/no-floating-promises": "off",
      "typescript/no-base-to-string": "warn",
      "typescript/restrict-template-expressions": "warn",
      "typescript/await-thenable": "warn",
      "typescript/no-redundant-type-constituents": "warn",
      "default-param-last": "error",
      "func-names": ["error", "always"],
      "func-style": ["error", "declaration"],
      "no-dupe-else-if": "error",
      "no-param-reassign": "error",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/exhaustive-deps": "warn",
      "react/no-array-index-key": "warn",
      "react/self-closing-comp": "error",
      "jsx-a11y/prefer-tag-over-role": "warn",
      "node/no-process-env": "warn",
      "import/no-cycle": "error",
      "oxc/no-barrel-file": "error",
      "typescript/no-dynamic-delete": "error",
      "typescript/no-inferrable-types": "error",
      "typescript/prefer-as-const": "error",
      "typescript/prefer-enum-initializers": "error",
      "typescript/prefer-namespace-keyword": "error",
      "unicorn/no-array-for-each": "error",
      "unicorn/prefer-number-properties": "error",
      "no-console": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      {
        files: ["**/*.config.ts", "packages/__env__/src/*.ts"],
        rules: {
          "node/no-process-env": "off",
        },
      },
      {
        files: ["packages/*/src/web/**/*.{ts,tsx}", "packages/*/src/native/**/*.{ts,tsx}"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["@modular-vsa/db", "@modular-vsa/db/**"],
                  message: "Please use the API instead of importing DB here.",
                },
              ],
            },
          ],
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
});
