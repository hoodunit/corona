const webpack = require("webpack")
const path = require("path")

const config = {
  mode: "development",
  devtool: "inline-source-map",
  target: "web",
  resolve: {
    extensions: [".js", ".mjs"],
  },
  entry: [path.join(__dirname, "./output/app.js")],
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "public"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre",
        exclude: [path.resolve(__dirname, "node_modules/")],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg|ico)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 10000,
            },
          },
        ],
      },
    ],
  }
}

module.exports = [config]
