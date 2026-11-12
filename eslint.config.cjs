const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    extends: compat.extends("curvenote"),

    settings: {
        next: {
            rootDir: ["apps/*/", "packages/*/"],
        },
    },
}, globalIgnores(["**/worktrees/"])]);
