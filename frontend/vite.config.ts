// File: frontend/vite.config.ts

import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: '../public',
		emptyOutDir: true
	},
	resolve: {
		alias: {
			'@scripts': '/src/scripts/compiled'
		}
	},
	root: 'src'
});
