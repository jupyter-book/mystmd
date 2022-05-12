module.exports = {
  verbose: true,
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['./test.setup.ts'],
};
