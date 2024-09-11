import { defineConfig } from 'vite';

export default defineConfig({
	root: './public',
	server: {
		port: 4000,
		open: true,
		hot: true,
		proxy: {
		'/api': 'https://localhost:3000',
		}
	}
});
