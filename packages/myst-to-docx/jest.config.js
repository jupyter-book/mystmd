module.exports = {
  preset: 'ts-jest',
  roots: ['./test', './src'],
  globals: {
    'ts-jest': {
      tsconfig: './src/tsconfig.json',
    },
  },
};
