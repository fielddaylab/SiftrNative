module.exports = {
  resolve: {
    alias: {
      "react-native": __dirname + "/fake-native.js"
    },
  },
  output: {
    filename: 'dist.js',
  },
}
