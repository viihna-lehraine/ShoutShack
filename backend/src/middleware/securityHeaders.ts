import { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import {
	contentSecurityPolicyOptions,
	helmetOptions as defaultHelmetOptions,
	permissionsPolicyOptions as defaultPermissionsPolicyOptions
} from '../config/securityOptions';
import { SecurityHeadersInterface } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export function initializeSecurityHeaders(
	app: Application,
	{
		helmetOptions = defaultHelmetOptions,
		permissionsPolicyOptions = defaultPermissionsPolicyOptions,
		validateDependencies
	}: SecurityHeadersInterface
): void {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

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
		const configurationError =
			new errorHandler.ErrorClasses.ConfigurationError(
				`Failed to apply application security headers using Helmet middleware: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
				{ exposeToClient: false }
			);
		errorLogger.logWarn(configurationError.message);
		errorHandler.handleError({ error: configurationError });
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
				const expressMiddlewareError =
					new errorHandler.ErrorClasses.ExpressError(
						`Error occurred when initializing ${middleware}: ${expressError instanceof Error ? expressError.message : String(expressError)}`,
						{ exposeToClient: false }
					);
				errorLogger.logError(expressMiddlewareError.message);
				errorHandler.expressErrorHandler()(
					expressMiddlewareError,
					req,
					res,
					next
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
		const configurationError =
			new errorHandler.ErrorClasses.ConfigurationError(
				`Failed to apply Content Security Policy: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
				{ exposeToClient: false }
			);
		errorLogger.logError(configurationError.message);
		errorHandler.handleError({ error: configError });
		process.exit(1);
	}

	try {
		app.use((req: Request, res: Response, next: NextFunction) => {
			res.setHeader('Expect-CT', 'enforce, max-age=86400');
			logger.info('Expect-CT header set successfully');
			next();
		});
	} catch (configError) {
		const configurationError =
			new errorHandler.ErrorClasses.ConfigurationError(
				`Failed to apply Expect-CT header: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
				{ exposeToClient: false }
			);
		errorLogger.logError(configurationError.message);
		errorHandler.handleError({ error: configError });
	}
}
