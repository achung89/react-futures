module.exports = api => {
  const isTest = api.env('test');
  return isTest ? {
    presets: [['@babel/preset-env', {
      "useBuiltIns": "entry",
      "modules": 'umd'
    }], '@babel/preset-react', "@babel/preset-typescript"],
    "plugins": ["@babel/plugin-proposal-class-properties"]

  } : {
      "presets": [
        ["@babel/env", {       "useBuiltIns": "entry",
        "modules": false }],
        ["@babel/preset-typescript"]
      ],
      "plugins": ["@babel/plugin-proposal-class-properties"]
    }
}