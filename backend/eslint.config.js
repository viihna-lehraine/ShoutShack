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
				ecmaVersion: 2022,
				sourceType: 'module',
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
			'prefer-const': 'error',
			'no-var': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-template': 'error',
			'no-useless-concat': 'error',
			'object-shorthand': 'error',
			'arrow-parens': ['error', 'as-needed'],
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface']
		},
		ignores: [
			'keys/',
			'logs/',
			'types/**/*.d.ts',
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
			'src/config/*.*'
		],
	},
	{
		files: ['**/*.js', '**/*.mjs'],
		languageOptions: {
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: ['@babel/preset-env'],
				},
			},
			ecmaVersion: 2022,
			sourceType: 'module',
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
			'prefer-const': 'error',
			'no-var': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-template': 'error',
			'no-useless-concat': 'error',
			'object-shorthand': 'error',
			'arrow-parens': ['error', 'as-needed']
		},
		ignores: [
			'keys/',
			'logs/',
			'types/**/*.d.ts',
			'node_modules/',
			'.babelrc',
			'.dockerignore',
			'.nvmrc',
			'.prettierignore',
			'.prettierrc',
			'backend.env',
			'Dockerfile',
			'nodemon.json',
			'eslint.config.js'
		],
	},
];
