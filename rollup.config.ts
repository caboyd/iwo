import resolve from '@rollup/plugin-node-resolve'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2';
import glslify from 'rollup-plugin-glslify'

const pkg = require('./package.json');

const libraryName = 'iwo';

export default {
    input: `src/${libraryName}.ts`,
    output: [
        { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
        { file: pkg.module, format: 'es', sourcemap: true },
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: ["gl-matrix"],
    plugins: [
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve( {
          //extensions: [".mjs", ".js", ".ts", ".tsx ", ".frag", ".vert", ".json"],
          browser:true
        }),
        // Compile TypeScript files
        typescript(),
        glslify({
            //compress removes spaces and new line breaks after keywords like 'else' breaking shaders with braces
            compress: false,
        }),
        // Resolve source maps to the original source
        sourceMaps(),
        ]
}