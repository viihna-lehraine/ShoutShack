import { merge } from 'webpack-merge';
import commonConfig from './webpack.common.js';

export default merge(commonConfig, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
		port: 3000,
		hot: true
	}
});
