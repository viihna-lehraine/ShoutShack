// File: server/backend/eslint.config.js

export default [
	{
		ignores: ['node_modules/', 'dist/']
	},
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		plugins: {
			'@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
			prettier: require('eslint-plugin-prettier')
		},
		rules: {
			'prettier/prettier': 'error',
			'no-console': 'warn',
			'@typescript-eslint/no-unused-vars': 'warn'
		}
	}
];
