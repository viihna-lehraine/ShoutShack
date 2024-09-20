import os from 'os';
import { ConfigService } from '../config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';

interface MemoryStats {
	rss: string; // MB
	heapTotal: string; // MB
	heapUsed: string; // MB
	external: string; // MB
	available: string; // MB
}

interface MemoryMonitorDependencies {
	os: typeof os;
	process: NodeJS.Process;
	setInterval: typeof setInterval;
}

export function createMemoryMonitor({
	os,
	process,
	setInterval
}: MemoryMonitorDependencies): {
	startMemoryMonitor: () => NodeJS.Timeout;
} {
	const appLogger = ConfigService.getInstance().getLogger();
	const envVariables = ConfigService.getInstance().getEnvVariables();

	try {
		validateDependencies(
			[
				{ name: 'process', instance: process },
				{ name: 'setInterval', instance: setInterval }
			],
			appLogger || console
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
				ErrorLogger.logWarning(utilityError.message);
				processError(utilityError);
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
		ErrorLogger.logWarning(utilityError.message);
		processError(utilityError);
		return { startMemoryMonitor: () => setInterval(() => {}, 0) }; // no-op function
	}
}
