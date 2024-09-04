import { Application, NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import { environmentVariables } from '../config/environmentConfig';
import { setupLogger } from '../config/logger';
import {
	contentSecurityPolicyOptions,
	helmetOptions as defaultHelmetOptions,
	permissionsPolicyOptions as defaultPermissionsPolicyOptions
} from '../config/securityOptions';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

interface SecurityHeadersDependencies {
	helmetOptions?: HelmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
}

const logger = setupLogger({
	serviceName: 'security-headers',
	isProduction: environmentVariables.nodeEnv === 'production'
});

export function setupSecurityHeaders(
	app: Application,
	{
		helmetOptions = defaultHelmetOptions,
		permissionsPolicyOptions = defaultPermissionsPolicyOptions
	}: SecurityHeadersDependencies
): void {
	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'helmetOptions', instance: helmetOptions },
				{
					name: 'permissionsPolicyOptions',
					instance: permissionsPolicyOptions
				}
			],
			logger
		);

		app.use(helmet(helmetOptions));
		logger.info('Helmet middleware applied successfully');
	} catch (error) {
		handleGeneralError(error, logger);
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
				logger.info('Permissions-Policy header set successfully');
			} catch (error) {
				handleGeneralError(error, logger, req);
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
		logger.info('Content Security Policy applied successfully');
	} catch (error) {
		handleGeneralError(error, logger);
	}

	try {
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			logger.info('Expect-CT header set successfully');
			next();
		});
	} catch (error) {
		handleGeneralError(error, logger);
	}
}
