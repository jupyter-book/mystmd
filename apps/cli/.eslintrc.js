module.exports = {
  root: true,
  extends: ['curvenote'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: ['./tsconfig.test.json'],
    tsconfigRootDir: __dirname,
  },
};
