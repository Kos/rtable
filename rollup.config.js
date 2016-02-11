import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/rtable.jsx',
  dest: 'dist/rtable.js',
  format: 'iife',
  moduleName: 'RTable',
  plugins: [babel({
    "presets": ["es2015-rollup", "react"]
  })],
  external: ['react'],
  globals: {
    react: 'React'
  }
};
