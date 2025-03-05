// File: frontend/vite.config.ts

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src',
	build: {
		outDir: '../public',
		emptyOutDir: true
	}
});
