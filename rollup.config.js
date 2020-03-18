import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'umd',
    name: 'ReactFutures'
  },
  plugins: [
    babel(),
    typescript()
  ]
};