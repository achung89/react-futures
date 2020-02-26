module.exports = {
    presets: [["@babel/preset-env", {
      "useBuiltIns": "usage",
      corejs: "3",
      "modules": "umd"
    }],
    "@babel/preset-typescript",
    '@babel/preset-react'],
    plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-runtime"]
  }