import { Application, NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import {
	contentSecurityPolicyOptions,
	helmetOptions as defaultHelmetOptions,
	permissionsPolicyOptions as defaultPermissionsPolicyOptions
} from '../config/securityOptions';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { expressErrorHandler, processError } from '../errors/processError';
import { logger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

interface SecurityHeadersDependencies {
	helmetOptions?: HelmetOptions;
	permissionsPolicyOptions?: {
		[key: string]: string[];
	};
}

export function initializeSecurityHeaders(
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
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to apply application security headers using Helmet middleware: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logWarning(configurationError.message, logger);
		processError(configurationError, logger);
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
			} catch (expressError) {
				const middleware: string = 'Permissions-Policy Middleware';
				const errorResponse: string = 'Internal Server Error';
				const expressMiddlewareError = new errorClasses.ExpressError(
					`Error occurred when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
					{ severity: ErrorSeverity.FATAL, exposeToClient: false }
				);
				ErrorLogger.logError(expressMiddlewareError, logger);
				expressErrorHandler({ logger })(
					expressMiddlewareError,
					req,
					res,
					errorResponse
				);
				res.status(500).json({ error: 'Internal Server Error' });
				process.exit(1);
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
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to apply Content Security Policy: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, logger);
		processError(configError, logger);
		process.exit(1);
	}

	try {
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			logger.info('Expect-CT header set successfully');
			next();
		});
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to apply Expect-CT header: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, logger);
		processError(configError, logger);
	}
}
