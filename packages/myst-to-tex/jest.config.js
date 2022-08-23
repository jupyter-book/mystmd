module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    mystjs: '<rootDir>/../../node_modules/mystjs/dist/index.umd.js',
  },
};
