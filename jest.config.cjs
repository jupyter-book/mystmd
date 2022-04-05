module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    mystjs: '<rootDir>/node_modules/mystjs/dist/index.umd.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.base.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/'],
};
