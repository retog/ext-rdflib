// This library allows us to combine paths easily
const path = require('path');
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, 'js', 'rdf.js'),
  output: {
    path: path.resolve(__dirname, 'distribution'),
    filename: 'rdf.js',
    libraryTarget: 'var',
    library: '$rdf'
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { 
              presets: ['env']
            }
        }
      }
    ],
  },
  externals: {
    'node-fetch': 'fetch',
    'xmldom': 'window'
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
  ]
};