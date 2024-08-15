import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 12,
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				browser: true,
				es2021: true,
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettierPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
		},
		ignores: [
			'keys/',
			'logs/',
			'node_modules/',
			'.babelrc',
			'.dockerignore;',
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
	{
		files: ['**/*.js', '**/*.jsx'],
		languageOptions: {
			ecmaVersion: 12,
			sourceType: 'module',
			globals: {
				browser: true,
				es2021: true,
			},
		},
		plugins: {
			prettier: prettierPlugin,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
		},
		ignores: [
			'keys/',
			'logs/',
			'node_modules/',
			'.babelrc',
			'.dockerignore;',
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
