module.exports = {
  rootDir: '../../',
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: ['<rootDir>/packages/myst-to-docx/test/**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  verbose: true,
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '<rootDir>/packages/myst-to-docx/node_modules/(?!(vfile|vfile-message|unified|bail|trough|zwitch|unist-|hast-|rehype-|mdast-|trim-|web-namespaces))',
    '<rootDir>/node_modules/(?!(vfile|vfile-message|unified|bail|trough|zwitch|unist-|hast-|rehype-|mdast-|trim-|web-namespaces))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
