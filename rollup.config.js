import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript(), // Integration between Rollup and Typescript
    commonjs(), // Convert CommonJS modules to ES6
    babel({ babelHelpers: 'bundled' }), // transpile ES6/7 code
    resolve(), // resolve third party modules in node_modules
    json(), // import json files as modules
  ],
  output: [
    {
      file: 'dist/index.umd.js',
      format: 'umd', // commonJS
      name: 'myst', // window.name if script loaded directly in browser
      sourcemap: true,
    },
    {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'myst',
      plugins: [terser()],
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.min.js',
      format: 'esm', // ES Modules
      plugins: [terser()],
      sourcemap: true,
    },
  ],
};
