module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/js-with-ts', // or other ESM presets
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  testTimeout: 20000,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '<rootDir>/packages/jtex/node_modules/(?!(vfile|formdata-polyfill|chalk|fetch-blob|vfile-message|unified|bail|trough|zwitch|unist-|hast-|html-|rehype-|mdast-|micromark-|trim-|web-namespaces|property-information|space-separated-tokens|comma-separated-tokens|get-port|stringify-entities|character-entities-html4|ccount))',
    '<rootDir>/node_modules/(?!(vfile|formdata-polyfill|chalk|fetch-blob|vfile-message|unified|bail|trough|zwitch|unist-|hast-|html-|rehype-|mdast-|micromark-|trim-|web-namespaces|property-information|space-separated-tokens|comma-separated-tokens|get-port|stringify-entities|character-entities-html4|ccount))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
