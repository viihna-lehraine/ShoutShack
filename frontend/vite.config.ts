// File: frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	base: '/',
	build: {
		assetsDir: 'assets',
		emptyOutDir: false,
		outDir: '../public',
		rollupOptions: {
			input: 'index.html'
		}
	},
	plugins: [react()],
	publicDir: '../public',
	root: 'src',
	server: {
		host: '0.0.0.0',
		open: true,
		port: 5173,
		strictPort: true
	}
});
