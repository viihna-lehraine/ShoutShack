import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import nodePlugin from 'eslint-plugin-node';
import securityPlugin from 'eslint-plugin-security';
import noSecretsPlugin from 'eslint-plugin-no-secrets';
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
				es2021: true,
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettierPlugin,
			node: nodePlugin,
			security: securityPlugin,
			'no-secrets': noSecretsPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'node/no-unsupported-features/es-syntax': 'off', 
			'security/detect-object-injection': 'off',
			'no-secrets/no-secrets': ['error', { tolerance: 5 }],
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
			'src/config/*.*',
		],
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2015,
			sourceType: 'module',
			globals: {
				browser: true,
				es2021: true,
			},
		},
		plugins: {
			prettier: prettierPlugin,
			node: nodePlugin,
			security: securityPlugin,
			'no-secrets': noSecretsPlugin,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'node/no-unsupported-features/es-syntax': 'off',
			'security/detect-object-injection': 'off',
			'no-secrets/no-secrets': ['error', { tolerance: 5 }],
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
