module.exports = {
  roots: ['<rootDir>'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 10000,
  // verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  setupFilesAfterEnv: [],
  verbose: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/'],
};
