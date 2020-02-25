module.exports = api => {
  const isTest = api.env('test');
  return isTest ? {
    presets: [["@babel/preset-env", {
      "useBuiltIns": "entry",
      "modules": "umd"
    }],
    "@babel/preset-typescript",
    '@babel/preset-react'],
    plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-runtime", "@babel/plugin-transform-classes"]

  } : {
      "presets": [
        ["@babel/preset-env", {
          "useBuiltIns": "entry",
          "modules": false
        }],
        "@babel/preset-typescript"
      ],
      "plugins": ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-runtime"]
    }
}