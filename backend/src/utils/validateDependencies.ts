import { isLogger, Logger } from '../config/logger';

interface Dependency {
	name: string;
	instance: unknown;
}

export function validateDependencies(
	dependencies: Dependency[],
	logger: Logger | Console = console
): void {
	const logInfo = isLogger(logger) ? logger.info : console.info;
	const logWarn = isLogger(logger) ? logger.warn : console.warn;
	const logError = isLogger(logger) ? logger.error : console.error;

	if (!dependencies || dependencies.length === 0) {
		logWarn('No dependencies provided for validation');
		throw new Error('No dependencies provided for validation');
	}

	try {
		const missingDependencies = dependencies.filter(
			({ instance }) => instance === undefined || instance === null
		);

		if (missingDependencies.length > 0) {
			const missingNames = missingDependencies
				.map(({ name }) => name)
				.join(', ');
			logError(`Missing dependencies: ${missingNames}`);
			throw new Error(`Missing dependencies: ${missingNames}`);
		}

		logInfo(
			`All dependencies are valid: ${dependencies
				.map(({ name }) => name)
				.join(', ')}`
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error';
		const stack = error instanceof Error ? error.stack : 'No stack trace';

		if (isLogger(logger)) {
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
