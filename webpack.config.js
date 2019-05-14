const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const CleanWebpackPlugin = require('clean-webpack-plugin');

let examples = {
	pbr_example: "PBR Example",
	sphere_geometry_example: "Sphere Geometry Example"
};

const buildConfig = (env, argv) => {
	return {
		entry: {
			'iwo.min': './src/index.ts',
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			//setting this breaks relative paths
			publicPath: '/',
		},
		optimization: {
			minimize: true,
		},
		plugins: [
			new CleanWebpackPlugin(),
		],
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
					loader: 'ts-loader',
					options: {
						configFile: 'tsconfig.types.json'
					}
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
	const is_dev_server = (env && env.devServer);
	return {
		entry: {
			//glob this
			'examples/pbr_example': 'examples/pbr_example.ts',
			'examples/sphere_geometry_example': 'examples/sphere_geometry_example.ts'
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			//Note: Webstorm debug breaks if filename is [name].js
			filename: is_dev_server ? '[name].bundle.js' : '[name].js',
			//setting this breaks relative paths
			//publicPath: '/',
		},
		optimization: {
			minimize: false,
			splitChunks: {
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/](gl-matrix)[\\/]/,
						name: 'gl-matrix',
						chunks: 'initial',
						minChunks: 1,
					},
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
				chunks: ['iwo', 'gl-matrix', `examples/${id}`],
				filename: `examples/${id}.html`,
				template: 'examples/template.html',
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
				template: 'examples/index.html',
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
								name: is_production ?
									'[path][hash].[ext]' :
									'[path][name].[ext]',
							},
						},
					],
				}
			]
		},
		devtool: "source-map",
	};
}

module.exports = [buildExamplesConfig, buildConfig];

