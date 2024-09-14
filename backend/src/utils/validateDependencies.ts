import { isLogger, Logger } from './logger';

interface Dependency {
	name: string;
	instance: unknown;
}

function getCallerInfo(): string {
	const stack = new Error().stack;
	if (stack) {
		const stackLines = stack.split('\n');
		const callerLine = stackLines[3]?.trim();
		return callerLine || 'Unknown caller';
	}
	return 'No stack trace available';
}

export function validateDependencies(
	dependencies: Dependency[],
	logger: Logger | Console = console
): void {
	const logInfo = isLogger(logger) ? logger.info : console.info;
	const logWarn = isLogger(logger) ? logger.warn : console.warn;
	const logError = isLogger(logger) ? logger.error : console.error;

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
