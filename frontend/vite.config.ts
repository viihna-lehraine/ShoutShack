// File: frontend/vite.config.ts

import { defineConfig } from 'vite';

export default defineConfig({
	base: './',
	build: {
		assetsDir: 'assets',
		emptyOutDir: true,
		manifest: true,
		outDir: '../public',
		rollupOptions: {
			input: 'src/index.html'
		},
		sourcemap: true
	},
	root: 'src',
	server: {
		open: true,
		port: 5173
	}
});
