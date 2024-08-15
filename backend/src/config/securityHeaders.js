import helmet from 'helmet';
import permissionsPolicy from 'permissions-policy';

export default function setupSecurityHeaders(app) {
	// Helmet Initial Configuration
	app.use(
		helmet({
			frameguard: { action: 'deny' },
			dnsPrefetchControl: { allow: false },
			hidePoweredBy: true,
			hsts: {
				maxAge: 31536000, // 1 year
				includeSubDomains: true,
				preload: true, // enable HSTS preload list
			},
			ieNoOpen: true,
			noSniff: true,
			xssFilter: true,
		})
	);

	// Helmet CSP Configuration
	app.use(
		helmet.contentSecurityPolicy({
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: [
					"'self'",
					'https://api.haveibeenpwned.com', // Allow external script
				],
				styleSrc: [
					"'self'", // Allow styles from your own domain
					"'unsafe-inline'", // Add this if you have inline styles
				],
				fontSrc: ["'self'"],
				imgSrc: ["'self'", 'data:'], // Allow images from your domain and data URIs
				connectSrc: [
					"'self'",
					'https://api.haveibeenpwned.com',
					'https://cdnjs.cloudflare.com',
				],
				objectSrc: ["'none'"],
				upgradeInsecureRequests: [], // Automatically upgrade HTTP to HTTPS
				frameAncestors: ["'none'"],
			},
			reportOnly: false, // Set to true to test CSP without enforcement
		})
	);

	// Enforce Certificate Transparency
	app.use((req, res, next) => {
		res.setHeader('Expect-CT', 'enforce, max-age=86400');
		next();
	});

	// Configure Permissions Policy
	app.use(
		permissionsPolicy({
			features: {
				fullscreen: ['self'], // Remove quotes here
				geolocation: ['none'], // Disallow geolocation
				microphone: ['none'], // Disallow microphone access
				camera: ['none'], // Disallow camera access
				payment: ['none'], // Disallow payment requests
			},
		})
	);
}
