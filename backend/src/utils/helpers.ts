import { DependencyInterface } from '../index/interfaces';

export function sanitizeRequestBody(
	body: Record<string, unknown>
): Record<string, unknown> {
	const sanitizedBody = new Map(Object.entries(body));
	const sensitiveFields = [
		'email',
		'key',
		'newPassword',
		'oldPassword',
		'passphrase',
		'password',
		'secret',
		'token',
		'username'
	];

	sensitiveFields.forEach(field => {
		if (sanitizedBody.has(field)) {
			sanitizedBody.set(field, '[REDACTED]');
		}
	});

	return Object.fromEntries(sanitizedBody);
}

export function validateDependencies(
	dependencies: DependencyInterface[],
	logger: AppLoggerServiceInterface
): void {
	const logInfo = isAppLogger(appLogger) ? appLogger.info : console.info;
	const logWarn = isAppLogger(appLogger) ? appLogger.warn : console.warn;
	const logError = isAppLogger(appLogger) ? appLogger.error : console.error;

	const callerInfo = getCallerInfo();

	if (!dependencies || dependencies.length === 0) {
		logWarn('No dependencies provided for validation');
		throw new Error('No dependencies provided for validation');
	}

	try {
		logInfo(
			`Validating the following dependencies (called from: ${callerInfo}): ${dependencies.map(dep => `${dep.name}: ${dep.instance}`).join(', ')}`
		);

		const missingDependencies = dependencies.filter(
			({ instance }) => instance === undefined || instance === null
		);

		if (missingDependencies.length > 0) {
			const missingNames = missingDependencies
				.map(({ name }) => name)
				.join(', ');
			logError(`
				Missing dependencies (called from ${callerInfo}): ${missingNames}`);
			throw new Error(`Missing dependencies: ${missingNames}`);
		}

		logInfo(
			`All dependencies are valid (called from: ${callerInfo}): ${dependencies
				.map(({ name }) => name)
				.join(', ')}`
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error';
		const stack = error instanceof Error ? error.stack : 'No stack trace';

		if (isAppLogger(appLogger)) {
			appLogger.error('An error occurred during dependency validation', {
				stack: stack ?? 'No stack trace',
				message: message ?? 'Unknown error'
			});
		} else {
			console.error('An error occurred during dependency validation', {
				stack: stack ?? 'No stack trace',
				message: message ?? 'Unknown error'
			});
		}
		throw error;
	}
}

export function isErrorLoggerService(
	service: LoggerService
): service is ErrorLoggerService {
	return (service as ErrorLoggerService).logAppError !== undefined;
}
