import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
export default {
  input: "./src/index.ts",
  output: {
    file: "build/index.js",
    format: "umd",
    name: "ReactFutures",
    sourcemap: true,
    globals: {
      react: "React",
    },
  },
  external: ['react'],
  plugins: [

    resolve({
      customResolveOptions: {
        moduleDirectory: "node_modules",
      },
      extensions: ['.ts', '.js'],
    }),
    commonjs(),
    babel({
      exclude: "node_modules/**",
      extensions: ['.ts', '.js'],
      runtimeHelpers: true
    }),
    terser(),
  ],
};
