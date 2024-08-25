import os from 'os';
import setupLogger from '../config/logger';

const logger = setupLogger();

interface MemoryStats {
	rss: string;
	heapTotal: string;
	heapUsed: string;
	external: string;
	available: string;
}

function logMemoryUsage(): void {
	const memoryUsage = process.memoryUsage();
	const memoryStats: MemoryStats = {
		rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
		heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
		heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
		external: (memoryUsage.external / 1024 / 1024).toFixed(2),
		available: (os.freemem() / 1024 / 1024).toFixed(2)
	};

	logger.info(
		`Memory usage (MB): RSS: ${memoryStats.rss}, Heap Total: ${memoryStats.heapTotal}, Heap Used: ${memoryStats.heapUsed}, External: ${memoryStats.external}, System Available: ${memoryStats.available}`
	);
}

export function startMemoryMonitor(): NodeJS.Timeout {
	return setInterval(logMemoryUsage, 15000);
}
