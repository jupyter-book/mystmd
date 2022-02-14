const merge = require('webpack-merge').default
const express = require('express')
const path = require('path')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    onBeforeSetupMiddleware(server) {
      server.app.use('/images', express.static(path.resolve('images')))
    },
  },
})
