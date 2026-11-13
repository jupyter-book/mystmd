import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import prettierPluginConfig from 'eslint-plugin-prettier/recommended';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const config = defineConfig([
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/jsx-key': 'off',
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // This errors out on '~/module' that is defined in tsconfig
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: false,
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'array-callback-return': [
        'error',
        {
          checkForEach: true,
        },
      ],
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          printWidth: 100,
          tabWidth: 2,
          semi: true,
          singleQuote: true,
        },
      ],
      'import/no-named-as-default-member': 'off',
      'import/no-extraneous-dependencies': 'off',
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
    },
  },
  prettierPluginConfig,
]);
