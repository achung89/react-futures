import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';
import { terser } from "rollup-plugin-terser";

export default {
  input: './src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'umd',
    name: 'ReactFutures',
    globals: {
      react: 'React'
    }
  },
  plugins: [
    babel(),
    typescript(),
    terser()
  ]
};