const merge = require('webpack-merge').default;
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
});
