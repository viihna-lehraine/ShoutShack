import helmet from 'helmet';
import permissionsPolicy from 'permissions-policy';

export default function setupSecureHeaders(app) {
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
				defaultSrc: ['self'],
				scriptSrc: [
					'self',
					// `'nonce-${res.locals.cspNonce}'`,
					'https://api.haveibeenpwned.com',
				],
				styleSrc: [
					'self',
					// `'nonce-${res.locals.cspNonce}'`
				],
				fontSrc: ['self'],
				imgSrc: ['self', 'data:'],
				connectSrc: [
					'self',
					'https://api.haveibeenpwned.com',
					'https://cdjns.cloudflare.com',
				],
				objectSrc: ['none'],
				upgradeInsecureRequests: [], // automatically upgrade HTTP to HTTPS
				frameAncestors: ['none'],
				reportUri: '/report-violation',
			},
			reportOnly: false, // *DEV-NOTE* set to true to test CSP without enforcement
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
				fullscreen: ['self'], // allow fullscreen only on same origin
				geolocation: ['none'], // disallow geolocation
				microphone: ['none'], // disallow microphone access
				camera: ['none'], // disallow camera access
				payment: ['none'], // disallow payment requests
			},
		})
	);
}
