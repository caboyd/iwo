const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const TerserPlugin = require('terser-webpack-plugin');

let libraryName = 'Iwo';

let examples = {
	pbr_example: "PBR Example",
	sphere_geometry_example: "Sphere Geometry Example"
};


const buildConfig = (env, argv) => {
	const is_production = argv.mode === 'production';
	return {
		entry: {
			'iwo': './src/index.ts',
			'iwo.min': './src/index.ts',
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			//setting this breaks relative paths
			publicPath: '/',
		},
		optimization: {
			minimize: is_production,
			minimizer: [new TerserPlugin({
				test: /\.min\.js(\?.*)?$/i,
			})],
		},
		resolve: {
			modules: [
				path.resolve(__dirname),
				'src',
				'node_modules'
			],
			// Add `.ts` and `.tsx` as a resolvable extension.
			extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.vert', '.frag'],

		},
		module: {
			rules: [
				// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
				{
					test: /\.tsx?$/,
					loader: 'ts-loader'
				},
				{
					test: /\.(glsl|vs|fs|frag|vert)$/,
					loader: 'raw-loader'
				},
				{
					test: /\.(txt|obj|mtl)$/,
					loader: 'raw-loader'
				},
			]
		},
		devtool: "source-map",
	};
}


const buildExamplesConfig = (env, argv) => {
	const is_production = argv.mode === 'production';
	return {
		entry: {
			//glob this
			'examples/pbr_example': 'examples/pbr_example.ts',
			'examples/sphere_geometry_example': 'examples/sphere_geometry_example.ts'
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			//setting this breaks relative paths
			//publicPath: '/',
		},
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
				template: 'index.html',
				title: `IWO Renderer - ${examples[id]}`,
				minify: {
					collapseWhitespace: false,
					minifyCSS: is_production
				}
			});
		}).concat(
			new ImageminPlugin({
				disable: !is_production,
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
				template: 'examples.html',
			})
		)
		,
		resolve: {
			modules: [
				path.resolve(__dirname),
				'src',
				'node_modules'
			],
			// Add `.ts` and `.tsx` as a resolvable extension.
			extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.vert', '.frag'],
		},
		module: {
			rules: [
				// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
				{
					test: /\.tsx?$/,
					loader: 'ts-loader'
				},
				{
					test: /\.(glsl|vs|fs|frag|vert)$/,
					loader: 'raw-loader'
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
								name(file) {
									if (!is_production) {
										return '[path][name].[ext]';
									}
									return '[path][hash].[ext]';
								},
							},

						},
					],


				}
			]
		},
		devtool: "source-map",
	};
}

module.exports = [buildConfig, buildExamplesConfig];

