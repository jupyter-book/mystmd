module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off',
    quotes: ['error', 'single'],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        printWidth: 88,
      },
    ],
  },
};
