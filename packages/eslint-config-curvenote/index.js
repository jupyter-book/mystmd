module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/jsx-key': 'off',
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // This errors out on '~/module' that is defined in tsconfig
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
  },
};
