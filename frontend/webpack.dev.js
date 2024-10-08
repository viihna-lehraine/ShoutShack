import path from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';
import commonConfig from './webpack.common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(commonConfig, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
		port: 3000,
		hot: true,
		static: {
			directory: path.resolve(__dirname, 'public')
		},
		historyApiFallback: true,
		watchFiles: {
			paths: ['public/**/*.html'],
			options: {
				ignored: /node_modules/
			}
		}
	}
});
