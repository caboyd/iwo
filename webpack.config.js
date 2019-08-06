const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
const TerserPlugin = require('terser-webpack-plugin');

let examples = {
	pbr_example: "PBR Example",
	sphere_geometry_example: "Sphere Geometry Example"
};

const buildConfig = (env, argv) => {
	return {
		entry: {
			'iwo.min': './src/iwo.ts',
			'iwo': './src/iwo.ts',
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			//setting this breaks relative paths
			publicPath: '/',
			//name of chunked out file
			library: 'iwo',
			libraryTarget: 'umd',
			globalObject: 'this',
		},
		optimization: {
			minimize: true,
			minimizer: [new TerserPlugin({
				test: /\.min\.js$/
			})]
		},
		plugins: [
			new HtmlWebpackExternalsPlugin({
				externals: [
					{
						module: 'gl-matrix',
						entry: 'gl-matrix-min.js',
						global: 'glMatrix',
					}
				],

			}),
		],
		resolve: resolve_rules,
		module: module_rules,
	};
};


const buildExamplesConfig = (env, argv) => {
	const is_dev_server = (env && env.devServer);
	const build_externals = {
		'gl-matrix': 'glMatrix',
		'iwo': 'iwo'
	};
	const dev_externals = {
		'gl-matrix': 'glMatrix',
	};

	return {
		entry: {
			//glob this
			'examples/pbr_example': 'examples/pbr_example.ts',
			'examples/sphere_geometry_example': 'examples/sphere_geometry_example.ts'
		},
		externals: is_dev_server ? dev_externals : build_externals,
		optimization: {
			minimize: false,
			splitChunks: {
				cacheGroups: {
					commons: {
						name: 'iwo',
						chunks: 'initial',
						minChunks: 2,
					}
				}
			},
		},
		plugins: Object.keys(examples).map(function (id) {
			return new HtmlWebpackPlugin({
				chunks: ['iwo', `examples/${id}`],
				filename: `examples/${id}.html`,
				template: 'examples/template.html',
				title: `IWO Renderer - ${examples[id]}`,
				minify: {
					collapseWhitespace: false,
					minifyCSS: false
				}
			});
		}).concat(
			new ImageminPlugin({
				test: /\.(jpe?g|png|gif|svg)$/i,
				jpegtran: {
					progressive: true
				},
				optipng: {
					optimizationLevel: 3
				}
			})
		).concat(
			new HtmlWebpackPlugin({
				chunks: [''],
				filename: 'index.html',
				template: 'examples/index.html',
			})
		)
		,
		resolve: resolve_rules,
		module: module_rules,
	};
};

const resolve_rules = {
	modules: [
		path.resolve(__dirname),
		'src',
		'node_modules'
	],
	// Add `.ts` and `.tsx` as a resolvable extension.
	extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.vert', '.frag'],
};

const module_rules = {
	rules: [
		// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
		{
			test: /\.tsx?$/,
			loader: 'ts-loader'
		},
		{
			test: /\.(glsl|vs|fs|frag|vert)$/,
			loader: 'raw-loader',
		},
		{
			test: /\.(glsl|vs|fs|frag|vert)$/,
			loader: 'string-replace-loader',
			options: {
				multiple: [

					{search: '\\r', replace: '', flags: 'g'},
					{search: '[ \\t]*\\/\\/.*\\n', replace: '', flags: 'g'}, // remove //
					{search: '[ \\t]*\\/\\*[\\s\\S]*?\\*\\/', replace: '', flags: 'g'}, // remove /* */
					{search: '\\n{2,}', replace: '\n', flags: 'g'}, // # \n+ to \n
					{search: '\\s\\s+', replace: ' ', flags: 'g'}, // reduce multi spaces to singles
				]
			}
		},
		{
			test: /\.(txt|obj|mtl)$/,
			loader: 'raw-loader'
		},
		{
			test: /\.(gif|jpeg|jpg|png|svg|hdr)$/,
			use: [
				{
					loader: 'file-loader',
					options: {
						name: '[path][name].[ext]',
					},
				},
			],
		}
	]
};

module.exports = [buildExamplesConfig, buildConfig];

