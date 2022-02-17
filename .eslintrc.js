module.exports = {
  root: true,
  env: {
    //
    browser: false,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb-typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./**/tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'no-skip-tests', 'no-only-tests'],
  rules: {
    'import/prefer-default-export': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'consistent-return': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    'import/export': 'off',
    'import/no-named-as-default': 'off', // disabled due to https://stackoverflow.com/a/44724874/11456655
    'no-multiple-empty-lines': 'off',
    'arrow-body-style': 'off',
    'class-methods-use-this': 'off',
  },
  settings: {
    react: {
      pragma: 'React',
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.spec.ts'],
      },
    },
  },
};
