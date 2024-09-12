import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				ecmaVersion: 12,
				sourceType: 'module'
			},
			globals: {
				browser: 'readonly',
				es6: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettierPlugin
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			indent: ['error', 'tab'],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'always']
		}
	},
	{
		files: ['**/*.js', 'public/**/*.js'],
		languageOptions: {
			ecmaVersion: 12,
			sourceType: 'module',
			globals: {
				browser: true,
				es2021: true
			}
		},
		plugins: {
			prettier: prettierPlugin
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			indent: ['error', 'tab'],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'always']
		}
	},
	{
		rules: {
			all: 'off'
		}
	}
];
