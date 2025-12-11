module.exports = {
  root: true,
  extends: ['curvenote'],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: true, optionalDependencies: false, peerDependencies: true },
    ],
  },
};
