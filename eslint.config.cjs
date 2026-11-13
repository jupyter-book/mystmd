const { defineConfig, globalIgnores } = require("eslint/config");

const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    "no-named-as-default-member": "off",
    "@typescript-eslint/no-unused-vars": "off",
          "import/no-named-as-default-member":"off"
  },
  {
    extends: compat.extends("curvenote"),

    settings: {
      next: {
        rootDir: ["apps/*/", "packages/*/"],
      },
    },
  },
  globalIgnores(["**/worktrees/"]),
]);
