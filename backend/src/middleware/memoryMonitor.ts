import { ProcessErrorStaticParameters } from '../parameters/errorParameters';
import {
	MemoryMonitorInterface,
	MemoryMonitorStats
} from '../index/middlewareInterfaces';

export function createMemoryMonitor({
	os,
	process,
	setInterval,
	appLogger,
	configService,
	errorClasses,
	ErrorSeverity,
	errorLogger,
	processError,
	validateDependencies
}: MemoryMonitorInterface): {
	startMemoryMonitor: () => NodeJS.Timeout;
} {
	const envVariables = configService.getEnvVariables();

	try {
		validateDependencies(
			[
				{ name: 'process', instance: process },
				{ name: 'setInterval', instance: setInterval }
			],
			appLogger
		);

		function logMemoryUsage(): void {
			try {
				const memoryUsage = process.memoryUsage();
				const memoryStats: MemoryMonitorStats = {
					rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
					heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
					heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
					external: (memoryUsage.external / 1024 / 1024).toFixed(2),
					available: (os.freemem() / 1024 / 1024).toFixed(2)
				};

				appLogger.info(
					`Memory usage (MB): RSS: ${memoryStats.rss}, Heap Total: ${memoryStats.heapTotal}, Heap Used: ${memoryStats.heapUsed}, External: ${memoryStats.external}, System Available: ${memoryStats.available}`
				);
			} catch (utilError) {
				const utilityError = new errorClasses.UtilityErrorRecoverable(
					`Failed to log memory usage\n${
						utilError instanceof Error
							? utilError.message
							: String(utilError)
					}`,
					{
						utility: 'logMemoryUsage',
						originalError: utilError,
						statusCode: 500,
						severity: ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				errorLogger.logWarning(
					utilityError.message,
					{},
					appLogger,
					ErrorSeverity.RECOVERABLE
				);
				processError({
					...ProcessErrorStaticParameters,
					error: utilityError,
					appLogger,
					details: { reason: 'Failed to log memory usage' }
				});
			}
		}

		function startMemoryMonitor(): NodeJS.Timeout {
			return setInterval(
				logMemoryUsage,
				envVariables.memoryMonitorInterval // ms
			);
		}

		return { startMemoryMonitor };
	} catch (utilError) {
		const utility: string = 'createMemoryMonitor()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to create and start memory monitor using the utility ${utility}: ${
				utilError instanceof Error
					? utilError.message
					: String(utilError)
			}`,
			{
				utility,
				exposeToClient: false
			}
		);
		errorLogger.logWarning(
			utilityError.message,
			{},
			appLogger,
			ErrorSeverity.RECOVERABLE
		);
		processError({
			...ProcessErrorStaticParameters,
			error: utilityError,
			appLogger,
			details: { reason: 'Failed to create and start memory monitor' }
		});
		return { startMemoryMonitor: () => setInterval(() => {}, 0) }; // no-op function
	}
}
