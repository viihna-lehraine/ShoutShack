import { DependencyInterface } from '../index/interfaces';
import { configService } from '../services/configService';
import { processError } from '../errors/processError';
import { AppError, ErrorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ProcessErrorStaticParameters } from '../index/parameters';
import { blankRequest } from './constants';

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

export function getCallerInfo(): string {
	const stack = new Error().stack;
	if (stack) {
		const stackLines = stack.split('\n');
		const callerLine = stackLines[3]?.trim();
		return callerLine || 'Unknown caller';
	}
	return 'No stack trace available';
}

export function parseBoolean(value: string | boolean | undefined): boolean {
	const appLogger = configService.getAppLogger() || console;

	try {
		validateDependencies([{ name: 'value', instance: value }], appLogger);

		if (value === undefined) {
			appLogger.warn(
				'Feature flag value is undefined. Defaulting to false'
			);
			return false;
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true';
		}
		return value === true;
	} catch (utilError) {
		const utilityError = new ErrorClasses.UtilityErrorFatal(
			`
			Fatal error: Unable to parse boolean value ${value} using 'parseBoolean()\n${utilError instanceof Error ? utilError.message : utilError}`,
			{
				utility: 'parseBoolean()',
				originalError: utilError
			}
		);
		const actionVal: string = 'Parse value to boolean';
		const severity: string = ErrorSeverity.FATAL;
		errorLogger.logError(
			utilityError as AppError,
			errorLoggerDetails(getCallerInfo, actionVal, blankRequest),
			appLogger,
			severity
		);
		processError({
			...ProcessErrorStaticParameters,
			error: utilityError,
			appLogger,
			details: { reason: 'Failed to parse data to type boolean' }
		});
		throw utilityError;
	}
}

export function validateDependencies(
	dependencies: DependencyInterface[],
	appLogger: AppLogger
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
