import browserSync from 'browser-sync';

browserSync.create().init({
	files: ['public/**/*.css', 'public/**/*.html'],
	notify: false,
	open: true,
	port: 3000,
	proxy: 'http://localhost:3047',
	serveStatic: ['public']
});
