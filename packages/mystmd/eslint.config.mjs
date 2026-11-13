import { config as baseConfig } from "@repo/eslint-config/base";
import { defineConfig } from "eslint/config";

/** @type {import("eslint").Linter.Config} */
const config = defineConfig([
  baseConfig,
  {
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: true,
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
    },
  },
]);
export default config;
