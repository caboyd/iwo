const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';
	return {
		entry: './src/main.ts',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'bundle.js',
			publicPath: ''
		},
		plugins: [
			new HtmlWebpackPlugin({
					title: '',
					filename: 'index.html',
					template: 'index.html',
					minify: {
						collapseWhitespace: isProduction,
						minifyCSS: isProduction
					}
				}
			),
			new ImageminPlugin(
				{
					disable: !isProduction,
					test: /\.(jpe?g|png|gif|svg)$/i,
					jpegtran: {
						progressive: true
					},
					optipng: {
						optimizationLevel: 3
					}
				}
			)
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
					test: /\.(gif|jpeg|jpg|png|svg)$/,
					loader: 'image-size-loader',
					options: {
						name: '[path][name].[ext]'
					},
				
				}
			]
		},
		devtool: "source-map"
	};
}
