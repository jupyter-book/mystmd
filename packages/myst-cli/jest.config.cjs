module.exports = {
  rootDir: '../../',
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: ['<rootDir>/packages/myst-cli/**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 10000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|xml)$':
      '<rootDir>/apps/cli/tests/__mocks__/fileMock.js',
    '#(.*)': '<rootDir>/node_modules/$1', // https://github.com/chalk/chalk/issues/532
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(vfile|formdata-polyfill|chalk|fetch-blob|vfile-message|unified|bail|trough|zwitch|unist-|hast-|html-|rehype-|mdast-|micromark-|trim-|web-namespaces|property-information|space-separated-tokens|comma-separated-tokens|get-port|stringify-entities|character-entities-html4|ccount))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/'],
};
