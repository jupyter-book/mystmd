module.exports = {
  rootDir: "../../",
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 10000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|xml)$':
      '<rootDir>/apps/cli/tests/__mocks__/fileMock.js',
    mystjs: '<rootDir>/node_modules/mystjs/dist/index.umd.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(vfile|vfile\-message|unified|bail|trough|zwitch|unist\-|hast\-|rehype\-|mdast\-|trim\-|web-namespaces))'],
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/'],
};
