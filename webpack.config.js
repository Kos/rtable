/* eslint-env node */
module.exports = {
  mode: "development",
  entry: {
    rtable: "./src/index.js",
    examples: "./src/examples.js",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }],
  },
};
