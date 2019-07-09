// This library allows us to combine paths easily
const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const fs = require('fs');
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
        test: /\.js$/,
        include: function(absPath){ 
          if (/js\/rdf.js$/.test(absPath)) {
            return true;
          }
          if (/jsonld/.test(absPath)) {
            return true;
          }
          if (/rdf-dataset-indexed/.test(absPath)) {
            return true;
          }
          let content = data = fs.readFileSync(absPath, 'utf8');
          if (content.indexOf("=>") > -1) {
            //console.log("babeling "+absPath);
            return true;
          }
          if (content.indexOf("let ") > -1) {
            //console.log("babeling "+absPath);
            return true;
          }
          if (content.indexOf("class ") > -1) {
            //console.log("babeling "+absPath);
            return true;
          }
          console.log("not babeling "+absPath);
          return false;
        },
        use: {
          loader: 'babel-loader',
          options: {
            "presets": [
              ["@babel/preset-env", {
                "targets": " > 1%, not IE 11, chrome 41",
                "spec": true,
                "useBuiltIns": "entry",
                "corejs": 3,
                "forceAllTransforms": true,
                "ignoreBrowserslistConfig": true,
                "modules": "commonjs",
                "debug": false, 
                "include": ["@babel/plugin-transform-arrow-functions"]
              }]
            ],
        
            "plugins": [
                ["@babel/plugin-transform-arrow-functions", { "spec": true }],
                ["@babel/plugin-transform-runtime",
                  {
                    "regenerator": true
                  }
                ],
                ["@babel/plugin-transform-object-assign"]
            ]
          }
        }
      }
    ]
  },
  externals: {
    'node-fetch': 'fetch',
    'xmldom': 'window',
    '@nleanba/ndjs': 'window'
  },
  optimization: {
    minimize: false
  },
  devtool: 'source-map',
  plugins: [
    /*new UglifyJSPlugin({
      test: /\.js($|\?)/i,
      sourceMap: true,
      uglifyOptions: {
          compress: true
      }
    }),*/
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require("./package.json").version)
    })
  ],
  devServer: {
    compress: true,
    disableHostCheck: true
  }
};