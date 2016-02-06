import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/rtable.jsx',
  dest: 'dist/rtable.js',
  format: 'umd',
  moduleName: 'RTable',
  plugins: [babel()]
};
