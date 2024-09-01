import { Application, NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import setupLogger from '../config/logger';
import {
	contentSecurityPolicyOptions,
	helmetOptions as defaultHelmetOptions,
	permissionsPolicyOptions as defaultPermissionsPolicyOptions
} from '../config/securityOptions';

interface SecurityHeadersDependencies {
	helmetOptions?: HelmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
}

const logger = setupLogger({
	serviceName: 'security-headers',
	isProduction: process.env.NODE_ENV === 'development' // *DEV-NOTE* set to production before deployment
});

export function setupSecurityHeaders(
	app: Application,
	{
		helmetOptions = defaultHelmetOptions,
		permissionsPolicyOptions = defaultPermissionsPolicyOptions
	}: SecurityHeadersDependencies
): void {
	try {
		app.use(helmet(helmetOptions));
	} catch (error) {
		logger.error(`Failed to set helmet middleware ${error}`);
	}

	if (
		permissionsPolicyOptions &&
		typeof permissionsPolicyOptions === 'object'
	) {
		app.use((req: Request, res: Response, next: NextFunction) => {
			try {
				const policies = Object.entries(permissionsPolicyOptions)
					.map(
						([feature, origins]) =>
							`${feature} ${origins.join(' ')}`
					)
					.join(', ');

				res.setHeader('Permissions-Policy', policies);
			} catch (error) {
				logger.error(
					`Failed to set Permissions-Policy header: ${error}`
				);
			}
			next();
		});
	} else {
		logger.warn('Permissions-Policy options are not provided or invalid');
	}

	try {
		app.use(
			helmet.contentSecurityPolicy({
				directives: contentSecurityPolicyOptions.directives,
				reportOnly: false
			})
		);
	} catch (error) {
		logger.error(`Failed to apply Content Security Policy: ${error}`);
	}

	try {
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			next();
		});
	} catch (error) {
		logger.error(`Failed to set Expect-CT header: ${error}`);
	}
}
