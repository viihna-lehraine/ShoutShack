import {
	AppLoggerServiceInterface,
	DependencyInterface
} from '../index/interfaces/main';

export function getCallerInfo(): string {
	const stack = new Error().stack;
	if (stack) {
		const stackLines = stack.split('\n');
		const callerLine = stackLines[3]?.trim();
		return callerLine || 'Unknown caller';
	}
	return 'No stack trace available';
}

export function isAppLogger(
	logger: AppLoggerServiceInterface | Console | undefined
): logger is AppLoggerServiceInterface {
	return (
		logger !== undefined &&
		logger !== null &&
		typeof logger.error === 'function' &&
		typeof logger.warn === 'function' &&
		typeof logger.debug === 'function' &&
		typeof logger.info === 'function' &&
		typeof logger.log === 'function'
	);
}

export function validateDependencies(
	dependencies: DependencyInterface[],
	logger: AppLoggerServiceInterface
): void {
	const logInfo = isAppLogger(logger) ? logger.info : console.info;
	const logWarn = isAppLogger(logger) ? logger.warn : console.warn;
	const logError = isAppLogger(logger) ? logger.error : console.error;

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

		if (isAppLogger(logger)) {
			logger.error('An error occurred during dependency validation', {
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

export async function withRetry<T>(
	operation: () => Promise<T> | T,
	maxRetries: number,
	delayMs: number,
	exponentialBackoff: boolean = false
): Promise<T> {
	let attempts = 0;

	while (attempts < maxRetries) {
		try {
			return await operation();
		} catch (error) {
			attempts++;

			if (attempts >= maxRetries) {
				throw error;
			}

			const delay = exponentialBackoff
				? delayMs * Math.pow(2, attempts - 1)
				: delayMs;

			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw new Error('Exceeded maximum retry attempts');
}
