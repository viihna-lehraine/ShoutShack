import { Application, NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import permissionsPolicy from 'permissions-policy';

interface SecurityHeadersDependencies {
	helmet: typeof helmet;
	permissionsPolicy: typeof permissionsPolicy;
	helmetOptions?: HelmetOptions;
	permissionsPolicyOptions?: {
		features: {
			[key: string]: string[];
		};
	};
}

export function setupSecurityHeaders({
	helmet,
	permissionsPolicy,
	helmetOptions = {
		frameguard: { action: 'deny' },
		dnsPrefetchControl: { allow: false },
		hidePoweredBy: true,
		hsts: {
			maxAge: 31536000, // 1 year
			includeSubDomains: true,
			preload: true // enable HSTS preload list
		},
		ieNoOpen: true,
		noSniff: true,
		xssFilter: true
	},
	permissionsPolicyOptions = {
		features: {
			fullscreen: ['self'], // allow fullscreen
			geolocation: ['none'], // disallow geolocation
			microphone: ['none'], // disallow microphone
			camera: ['none'], // disallow camera
			payment: ['none'] // disallow payment
		}
	}
}: SecurityHeadersDependencies) {
	return function setupSecurityHeaders(app: Application): void {
		// initial helmet configuration
		app.use(helmet(helmetOptions));

		// helmet CSP configuration
		app.use(
			helmet.contentSecurityPolicy({
				directives: {
					defaultSrc: ['self'],
					scriptSrc: [
						'self',
						'https://api.haveibeenpwned.com' // allow external script from this domain
					],
					styleSrc: [
						'self',
						'unsafe-inline' // *DEV-NOTE* COME BACK TO THIS
					],
					fontSrc: ['self'],
					imgSrc: [
						'self',
						'data:' // allow images from own domain and data URIs
					],
					connectSrc: [
						'self',
						'https://api.haveibeenpwned.com', // allow data from this domain
						'https://cdnjs.cloudflare.com' // allow data from this domain
					],
					objectSrc: ['none'],
					upgradeInsecureRequests: [], // automatically upgrade HTTP requests to HTTPS
					frameAncestors: ['none'] // disallow framing
				},
				reportOnly: false // set to test CSP without blocking requests
			})
		);

		// enforce certificate transparency
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			next();
		});

		// configure permissions policy
		app.use(permissionsPolicy(permissionsPolicyOptions));
	};
}
