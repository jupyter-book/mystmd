import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export const config = defineConfig([
  {
    extends: compat.extends("curvenote"),
  },
  {
    rules: {
      "no-named-as-default-member": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/no-named-as-default-member": "off",
      "preserve-caught-error": "off",
      "import/no-extraneous-dependencies": "off",
      "no-useless-assignment": "off",
    },
  },
]);
