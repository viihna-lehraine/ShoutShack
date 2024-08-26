export default defineConfig({
	test: {
		globals: true,
		coverage: {
			reporter: ['text', 'lcov'],
			reportsDirectory: './coverage'
		},
		environment: 'node',
		setupFiles: './tests/vitest.setup.mjs'
	}
});
