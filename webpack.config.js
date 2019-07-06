// This library allows us to combine paths easily
const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const folders = ['foo','bar'];

module.exports = {
  entry: path.resolve(__dirname, 'js', 'rdf.js'),
  output: {
    path: path.resolve(__dirname, 'distribution', 'latest'),
    filename: 'rdf.js',
    libraryTarget: 'umd',
    libraryExport: "default",
    library: '$rdf'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: ['babel-loader']
      }
    ]
  },
  externals: {
    'node-fetch': 'fetch',
    'xmldom': 'window',
    '@nleanba/ndjs': 'window'
  },
  devtool: 'source-map',
  plugins: [
    new UglifyJSPlugin({
      test: /\.js($|\?)/i,
      sourceMap: true,
      uglifyOptions: {
          compress: true
      }
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require("./package.json").version)
    })
  ]
};