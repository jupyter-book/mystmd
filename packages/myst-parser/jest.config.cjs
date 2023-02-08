module.exports = {
  rootDir: '../../',
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: ['<rootDir>/packages/myst-parser/**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(vfile|formdata-polyfill|chalk|fetch-blob|vfile-message|unified|bail|trough|zwitch|unist-|hast-|html-|rehype-|mdast-|micromark-|trim-|web-namespaces|property-information|space-separated-tokens|comma-separated-tokens|get-port|stringify-entities|character-entities-html4|ccount|array-iterate))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/docs/'],
};
