import os from 'os';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { envVariables } from '../environment/envVars';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface MemoryStats {
	rss: string; // MB
	heapTotal: string; // MB
	heapUsed: string; // MB
	external: string; // MB
	available: string; // MB
}

interface MemoryMonitorDependencies {
	logger: Logger;
	os: typeof os;
	process: NodeJS.Process;
	setInterval: typeof setInterval;
}

export function createMemoryMonitor({
	logger,
	os,
	process,
	setInterval
}: MemoryMonitorDependencies): {
	startMemoryMonitor: () => NodeJS.Timeout;
} {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'os', instance: os },
				{ name: 'process', instance: process },
				{ name: 'setInterval', instance: setInterval }
			],
			logger
		);

		function logMemoryUsage(): void {
			try {
				const memoryUsage = process.memoryUsage();
				const memoryStats: MemoryStats = {
					rss: (memoryUsage.rss / 1024 / 1024).toFixed(2), // convert bytes to MB
					heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
					heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
					external: (memoryUsage.external / 1024 / 1024).toFixed(2),
					available: (os.freemem() / 1024 / 1024).toFixed(2)
				};

				logger.info(
					`Memory usage (MB): RSS: ${memoryStats.rss}, Heap Total: ${memoryStats.heapTotal}, Heap Used: ${memoryStats.heapUsed}, External: ${memoryStats.external}, System Available: ${memoryStats.available}`
				);
			} catch (utilError) {
				const utility: string = 'logMemoryUsage()';
				const utilityError = new errorClasses.UtilityErrorRecoverable(
					`Failed to log memory usage using the utility ${utility}: ${
						utilError instanceof Error
							? utilError.message
							: String(utilError)
					}`,
					{
						utility,
						exposeToClient: false
					}
				);
				ErrorLogger.logWarning(utilityError.message, logger);
				processError(utilityError, logger);
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
		ErrorLogger.logWarning(utilityError.message, logger);
		processError(utilityError, logger);
		return { startMemoryMonitor: () => setInterval(() => {}, 0) }; // no-op function
	}
}
