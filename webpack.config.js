var path = require('path');

module.exports = {
  mode: 'production',
  entry: './src-web/web.js',
  output: {
    path: path.resolve(__dirname, 'web'),
    filename: 'dist.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            "presets": ["module:metro-react-native-babel-preset"]
          }
        }
      }
    ]
  }
};
