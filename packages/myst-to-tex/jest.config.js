module.exports = {
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  moduleNameMapper: {
    mystjs: '<rootDir>/../../node_modules/mystjs/dist/index.umd.js',
  },
};
