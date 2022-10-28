module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  testTimeout: 20000,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.base.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
