import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const commonConfig = {
	input: 'src/index.js',
	output: {
		name: 'yamodal',
		sourcemap: true,
	},
	plugins: [
		resolve({
			customResolveOptions: {
				moduleDirectory: 'node_modules',
			},
		}),
		commonjs(),
	],
};

// ESM config
const esmConfig = Object.assign({}, commonConfig);
esmConfig.output = Object.assign({}, commonConfig.output, {
	file: 'dist/esm/yamodal.esm.js',
	format: 'esm',
});

// ESM prod config
const esmProdConfig = Object.assign({}, esmConfig);
esmProdConfig.output = Object.assign({}, esmConfig.output, {
	file: 'dist/esm/yamodal.esm.min.js',
	sourcemap: false,
});
esmProdConfig.plugins = [...esmConfig.plugins, terser()];

// UMD config
const umdConfig = Object.assign({}, commonConfig);
umdConfig.output = Object.assign({}, commonConfig.output, {
	file: 'dist/umd/yamodal.js',
	format: 'umd',
});
umdConfig.plugins = [
	...commonConfig.plugins,
	babel({
		babelHelpers: 'bundled',
		exclude: 'node_modules/**',
	}),
];

// Production config
const umdProdConfig = Object.assign({}, umdConfig);
umdProdConfig.output = Object.assign({}, umdConfig.output, {
	file: 'dist/umd/yamodal.min.js',
	sourcemap: false,
});
umdProdConfig.plugins = [...umdConfig.plugins, terser()];

let configurations = [];
if (process.env.SERVE) {
	const serveConfig = Object.assign({}, commonConfig);
	serveConfig.input = 'render/index.js';
	serveConfig.output = Object.assign({}, commonConfig.output, {
		file: 'dist/render/yamodal.iife.js',
		format: 'iife',
	});
	serveConfig.plugins = [...umdConfig.plugins];
	serveConfig.plugins.push(
		serve({
			open: true,
			contentBase: ['dist'],
			host: 'localhost',
			port: '3030',
		}),
		livereload({
			watch: 'dist',
			verbose: false,
		})
	);
	configurations.push(serveConfig);
} else {
	configurations.push(esmConfig, esmProdConfig, umdConfig, umdProdConfig);
}

export default configurations;
