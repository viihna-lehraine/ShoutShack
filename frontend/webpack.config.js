import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    entry: './public/js/app.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'public/dist'),
      publicPath: '/',
      module: true,
    },
    experiments: {
      outputModule: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      esmodules: true,
                    },
                    modules: false,
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeAttributeQuotes: true,
            }
          : false,
      }),
    ],
    devServer: !isProduction
      ? {
          static: path.join(__dirname, 'public'),
          hot: true,
          port: 4000,
          open: true,
          historyApiFallback: true,
        }
      : undefined,
    resolve: {
      extensions: ['.js'],
      alias: {
        zxcvbn$: path.resolve(__dirname, 'node_modules/zxcvbn/dist/zxcvbn.js'),
      },
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};
