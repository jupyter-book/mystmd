module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 10000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|xml)$':
      '<rootDir>/tests/__mocks__/fileMock.js',
    mystjs: '<rootDir>/../../node_modules/mystjs/dist/index.umd.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/'],
};
