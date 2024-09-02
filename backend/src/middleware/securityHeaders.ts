import { Application, NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import { setupLogger } from '../config/logger';
import {
	contentSecurityPolicyOptions,
	helmetOptions as defaultHelmetOptions,
	permissionsPolicyOptions as defaultPermissionsPolicyOptions
} from '../config/securityOptions';
import { environmentVariables } from 'src/config/environmentConfig';

interface SecurityHeadersDependencies {
	helmetOptions?: HelmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
}

const logger = setupLogger({
	serviceName: 'security-headers',
	isProduction: environmentVariables.nodeEnv === 'production' // *DEV-NOTE* ensure this is set correctly before deployment
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
		logger.info('Helmet middleware applied successfully');
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Failed to set helmet middleware: ${error.message}`, {
				stack: error.stack
			});
		} else {
			logger.error(
				`Unknown error occurred in helmet middleware: ${String(error)}`
			);
		}
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
				if (error instanceof Error) {
					logger.error(
						`Failed to set Permissions-Policy header: ${error.message}`,
						{
							stack: error.stack
						}
					);
				} else {
					logger.error(
						`Unknown error occurred in Permissions-Policy header: ${String(error)}`
					);
				}
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
		if (error instanceof Error) {
			logger.error(
				`Failed to apply Content Security Policy: ${error.message}`,
				{
					stack: error.stack
				}
			);
		} else {
			logger.error(
				`Unknown error occurred in Content Security Policy: ${String(error)}`
			);
		}
	}

	try {
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			logger.info('Expect-CT header set successfully');
			next();
		});
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Failed to set Expect-CT header: ${error.message}`, {
				stack: error.stack
			});
		} else {
			logger.error(
				`Unknown error occurred in Expect-CT header: ${String(error)}`
			);
		}
	}
}
