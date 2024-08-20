import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import babelParser from '@babel/eslint-parser';
import prettierPlugin from 'eslint-plugin-prettier';
import nodePlugin from 'eslint-plugin-node';
import securityPlugin from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2015,
				sourceType: 'module',
			},
			globals: {
				browser: true,
				es6: true,
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettierPlugin,
			node: nodePlugin,
			security: securityPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'node/no-unsupported-features/es-syntax': 'off',
			'security/detect-object-injection': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
		},
		ignores: [
			'keys/',
			'logs/',
			'node_modules/',
			'.dockerignore',
			'.nvmrc',
			'.prettierignore',
			'.prettierrc',
			'backend.env',
			'Dockerfile',
			'nodemon.json',
			'eslint.config.js',
			'config/.babelrc',
			'src/config/*.*',
		],
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: ['@babel/preset-env'],
				},
			},
			ecmaVersion: 2015,
			sourceType: 'module',
			globals: {
				browser: true,
				es6: true,
			},
		},
		plugins: {
			prettier: prettierPlugin,
			node: nodePlugin,
			security: securityPlugin,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'node/no-unsupported-features/es-syntax': 'off',
			'security/detect-object-injection': 'off',
		},
		ignores: [
			'keys/',
			'logs/',
			'node_modules/',
			'.babelrc',
			'.dockerignore',
			'.nvmrc',
			'.prettierignore',
			'.prettierrc',
			'backend.env',
			'Dockerfile',
			'nodemon.json',
			'eslint.config.js',
			'src/config/secrets.json',
			'src/config/secrets.json.gpg',
		],
	},
];
