import { Application, NextFunction, Request, Response } from "express";
import helmet from 'helmet';
import permissionsPolicy from 'permissions-policy';

export default function setupSecurityHeaders(app: Application) {
	// Initial Helmet Configuration
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
					'https://api.haveibeenpwned.com', // allow external script from this domain
				],
				styleSrc: [
					"'self'", // allow styles from own domain
					"'unsafe-inline'", // *DEV-NOTE* only keep this if using inline styles 
				],
				fontSrc: ["'self'"],
				imgSrc: ["'self'", 'data:'], // allow images own domain and data URIs
				connectSrc: [
					"'self'",
					'https://api.haveibeenpwned.com',
					'https://cdnjs.cloudflare.com',
				],
				objectSrc: ["'none'"],
				upgradeInsecureRequests: [], // automatically upgrade HTTP to HTTPS
				frameAncestors: ["'none'"],
			},
			reportOnly: false, // set "true" to test CSP without enforcement
		})
	);

	// Enforce Certificate Transparency
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.setHeader('Expect-CT', 'enforce, max-age=86400');
		next();
	});

	// Configure Permissions Policy
	app.use(
		permissionsPolicy({
			features: {
				fullscreen: ['self'], // allow fullscreen
				geolocation: ['none'], // disallow geolocation
				microphone: ['none'], // disallow microphone access
				camera: ['none'], // disallow camera access
				payment: ['none'], // disallow payment requests
			},
		})
	);
}
