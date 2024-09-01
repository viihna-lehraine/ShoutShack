import { Application, NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';

interface SecurityHeadersDependencies {
	helmetOptions?: HelmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
}

export function setupSecurityHeaders(
	app: Application,
	{
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
			noSniff: true
		},
		permissionsPolicyOptions = {
			fullscreen: ["'self'"],
			geolocation: ["'none'"],
			microphone: ["'none'"],
			camera: ["'none'"],
			payment: ["'none'"]
		}
	}: SecurityHeadersDependencies
): void {
	app.use(helmet(helmetOptions));

	app.use((req: Request, res: Response, next: NextFunction) => {
		const policies = Object.entries(permissionsPolicyOptions)
			.map(([feature, origins]) => `${feature} ${origins.join(' ')}`)
			.join(', ');

		res.setHeader('Permissions-Policy', policies);
		next();
	});

	app.use(
		helmet.contentSecurityPolicy({
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", 'https://api.haveibeenpwned.com'],
				styleSrc: ["'self'", "'unsafe-inline'"],
				fontSrc: ["'self'"],
				imgSrc: ["'self'", 'data:'],
				connectSrc: [
					"'self'",
					'https://api.haveibeenpwned.com',
					'https://cdnjs.cloudflare.com'
				],
				objectSrc: ["'none'"],
				upgradeInsecureRequests: [],
				frameAncestors: ["'none'"]
			},
			reportOnly: false
		})
	);

	// Enforce certificate transparency
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.setHeader('Expect-CT', 'enforce, max-age=86400');
		next();
	});
}
