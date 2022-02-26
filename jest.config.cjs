module.exports = {
  preset: 'ts-jest/presets/default', // or other ESM presets
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.yalc/', '/dist/', 'docs'],
};
